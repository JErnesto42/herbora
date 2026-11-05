import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, getSessionToken } from '../services/api';

const emptyPlant = {
  nomePopular: '',
  nomeCientifico: '',
  categoria: '',
  resumo: '',
  usoTradicional: '',
  preparo: '',
  compostos: '',
  cuidados: '',
  combinacoes: '',
};

const sections = [
  {
    title: '1. Identificação',
    description: 'Como a planta é reconhecida no catálogo.',
    fields: [
      { key: 'nomePopular', label: 'Nome popular', placeholder: 'Ex.: Camomila' },
      { key: 'nomeCientifico', label: 'Nome científico', placeholder: 'Ex.: Matricaria chamomilla' },
      { key: 'categoria', label: 'Categoria', placeholder: 'Ex.: FLORES, FOLHAS ou RAÍZES' },
    ],
  },
  {
    title: '2. Visão geral',
    description: 'Resumo curto que aparece no catálogo.',
    fields: [
      { key: 'resumo', label: 'Resumo', placeholder: 'Descreva a planta em uma frase.', multiline: true },
    ],
  },
  {
    title: '3. Uso e preparo',
    description: 'Diferencie a tradição da orientação de preparo.',
    fields: [
      { key: 'usoTradicional', label: 'Uso tradicional', placeholder: 'Descreva o uso cultural/tradicional sem prometer benefícios.', multiline: true },
      { key: 'preparo', label: 'Preparo', placeholder: 'Registre como a infusão ou preparação costuma ser feita.', multiline: true },
    ],
  },
  {
    title: '4. Compostos e cuidados',
    description: 'Informações educativas e cautelas, sem substituir orientação profissional.',
    fields: [
      { key: 'compostos', label: 'Compostos e química', placeholder: 'Quais compostos são encontrados ou estudados?', multiline: true },
      { key: 'cuidados', label: 'Cuidados e contraindicações', placeholder: 'Registre possíveis riscos e grupos que devem buscar orientação.', multiline: true },
    ],
  },
  {
    title: '5. Combinações',
    description: 'Anote como outros ingredientes podem alterar a preparação.',
    fields: [
      { key: 'combinacoes', label: 'Combinações com outros ingredientes', placeholder: 'Explique como combinações podem mudar sabor, composição ou cuidados.', multiline: true },
    ],
  },
];

export default function ManagePlantsScreen() {
  const [token, setToken] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [plants, setPlants] = useState([]);
  const [form, setForm] = useState(emptyPlant);
  const [editingId, setEditingId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadPlants = useCallback(async (sessionToken) => {
    const result = await apiRequest('/plants', { token: sessionToken });
    setPlants(result.plants);
  }, []);

  useEffect(() => {
    let active = true;
    async function checkAdminAccess() {
      try {
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          setErrorMessage('Entre com uma conta de administrador para gerenciar o catálogo.');
          return;
        }
        const { user } = await apiRequest('/auth/me', { token: sessionToken });
        if (!active) return;
        if (user.role !== 'admin') {
          setErrorMessage('Sua conta não tem permissão para gerenciar plantas.');
          return;
        }
        setToken(sessionToken);
        setAuthorized(true);
        const result = await apiRequest('/plants', { token: sessionToken });
        if (active) setPlants(result.plants);
      } catch (error) {
        if (active) setErrorMessage(`Não foi possível carregar o catálogo: ${error.message}`);
      } finally {
        if (active) setLoading(false);
      }
    }
    checkAdminAccess();
    return () => { active = false; };
  }, []);

  function startEditing(plant) {
    setEditingId(plant.id);
    setForm(Object.fromEntries(
      Object.keys(emptyPlant).map((field) => [field, plant[field] || '']),
    ));
    setMessage('');
    setErrorMessage('');
    setConfirmingDeleteId(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyPlant);
    setMessage('');
    setErrorMessage('');
  }

  async function savePlant() {
    setMessage('');
    setErrorMessage('');
    if (Object.values(form).some((value) => !value.trim())) {
      setErrorMessage('Preencha todos os campos antes de salvar.');
      return;
    }

    setSaving(true);
    try {
      const path = editingId === null ? '/plants' : `/plants/${editingId}`;
      await apiRequest(path, {
        method: editingId === null ? 'POST' : 'PUT',
        body: form,
        token,
      });
      await loadPlants(token);
      setMessage(editingId === null ? 'Planta cadastrada no catálogo.' : 'Informações atualizadas.');
      setEditingId(null);
      setForm(emptyPlant);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deactivatePlant(id) {
    setMessage('');
    setErrorMessage('');
    try {
      await apiRequest(`/plants/${id}`, { method: 'DELETE', token });
      await loadPlants(token);
      setMessage('Planta removida do catálogo. O registro foi preservado no banco.');
      setConfirmingDeleteId(null);
      if (editingId === id) cancelEditing();
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  if (loading) {
    return <ActivityIndicator color="#315b43" style={styles.loading} />;
  }

  if (!authorized) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Acesso restrito</Text>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>ÁREA ADMINISTRATIVA</Text>
      <Text style={styles.title}>Catálogo de plantas</Text>
      <Text style={styles.description}>
        Preencha as informações por seção. Todos os campos são obrigatórios para manter as fichas
        organizadas e consistentes.
      </Text>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Plantas cadastradas ({plants.length})</Text>
        {plants.map((plant) => (
          <View key={plant.id} style={styles.plantRow}>
            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{plant.nomePopular}</Text>
              <Text style={styles.plantScientific}>{plant.nomeCientifico}</Text>
              <Text style={styles.plantCategory}>{plant.categoria}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.smallButton} onPress={() => startEditing(plant)} accessibilityRole="button">
                <Text style={styles.smallButtonText}>Editar</Text>
              </Pressable>
              <Pressable
                style={styles.smallDangerButton}
                onPress={() => setConfirmingDeleteId(confirmingDeleteId === plant.id ? null : plant.id)}
                accessibilityRole="button"
              >
                <Text style={styles.smallDangerText}>{confirmingDeleteId === plant.id ? 'Cancelar' : 'Desativar'}</Text>
              </Pressable>
              {confirmingDeleteId === plant.id && (
                <Pressable style={styles.confirmButton} onPress={() => deactivatePlant(plant.id)} accessibilityRole="button">
                  <Text style={styles.confirmText}>Confirmar remoção</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
        {!plants.length && <Text style={styles.help}>Ainda não há plantas cadastradas.</Text>}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>{editingId === null ? 'Adicionar uma planta' : 'Editar planta'}</Text>
        {sections.map((section) => (
          <View key={section.title} style={styles.formSection}>
            <Text style={styles.formSectionTitle}>{section.title}</Text>
            <Text style={styles.help}>{section.description}</Text>
            {section.fields.map((field) => (
              <View key={field.key}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  accessibilityLabel={field.label}
                  placeholder={field.placeholder}
                  placeholderTextColor="#829087"
                  value={form[field.key]}
                  onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
                  multiline={Boolean(field.multiline)}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                  autoCapitalize={field.key === 'nomeCientifico' ? 'none' : 'sentences'}
                  style={[styles.input, field.multiline && styles.multilineInput]}
                />
              </View>
            ))}
          </View>
        ))}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Revisão responsável</Text>
          <Text style={styles.help}>
            Use fontes confiáveis para verificar nomes e compostos. Não prometa tratamento ou
            benefícios médicos; mantenha os cuidados e contraindicações claros.
          </Text>
        </View>

        {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
        {!!message && <Text style={styles.success}>{message}</Text>}
        <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={savePlant} disabled={saving} accessibilityRole="button">
          {saving
            ? <ActivityIndicator color="#fffefa" />
            : <Text style={styles.primaryButtonText}>{editingId === null ? 'Salvar planta' : 'Salvar alterações'}</Text>}
        </Pressable>
        {editingId !== null && (
          <Pressable style={styles.cancelButton} onPress={cancelEditing} accessibilityRole="button">
            <Text style={styles.cancelButtonText}>Cancelar edição</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40, backgroundColor: '#f7f5ed' },
  loading: { flex: 1, backgroundColor: '#f7f5ed' },
  eyebrow: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#203b2e', fontSize: 28, fontWeight: '800', marginTop: 8 },
  description: { color: '#66766a', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 16 },
  listCard: { backgroundColor: '#fffefa', borderRadius: 18, padding: 16 },
  sectionTitle: { color: '#203b2e', fontSize: 18, fontWeight: '800' },
  plantRow: { borderBottomColor: '#e5e9e0', borderBottomWidth: 1, paddingVertical: 13 },
  plantInfo: { marginBottom: 9 },
  plantName: { color: '#203b2e', fontSize: 16, fontWeight: '700' },
  plantScientific: { color: '#66766a', fontSize: 13, fontStyle: 'italic', marginTop: 2 },
  plantCategory: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallButton: { backgroundColor: '#e8eddf', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  smallButtonText: { color: '#315b43', fontSize: 12, fontWeight: '700' },
  smallDangerButton: { backgroundColor: '#f6e8df', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  smallDangerText: { color: '#80513c', fontSize: 12, fontWeight: '700' },
  confirmButton: { backgroundColor: '#80513c', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  confirmText: { color: '#fffefa', fontSize: 12, fontWeight: '700' },
  formCard: { backgroundColor: '#fffefa', borderRadius: 18, padding: 17, marginTop: 16 },
  formSection: { borderTopColor: '#e5e9e0', borderTopWidth: 1, marginTop: 18, paddingTop: 16 },
  formSectionTitle: { color: '#315b43', fontSize: 15, fontWeight: '800' },
  help: { color: '#66766a', fontSize: 12, lineHeight: 18, marginTop: 5 },
  label: { color: '#203b2e', fontSize: 13, fontWeight: '700', marginTop: 14 },
  input: { backgroundColor: '#fffefa', borderColor: '#dce3d8', borderRadius: 12, borderWidth: 1, color: '#203b2e', minHeight: 46, padding: 12, marginTop: 7 },
  multilineInput: { minHeight: 94, paddingTop: 12 },
  notice: { backgroundColor: '#f0e9d8', borderRadius: 13, padding: 14, marginTop: 18 },
  noticeTitle: { color: '#203b2e', fontSize: 13, fontWeight: '800' },
  primaryButton: { alignItems: 'center', backgroundColor: '#315b43', borderRadius: 13, minHeight: 49, justifyContent: 'center', padding: 14, marginTop: 18 },
  primaryButtonText: { color: '#fffefa', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.7 },
  cancelButton: { alignItems: 'center', padding: 14, marginTop: 4 },
  cancelButtonText: { color: '#66766a', fontWeight: '700' },
  error: { color: '#963d33', fontSize: 13, lineHeight: 19, marginTop: 13 },
  success: { color: '#315b43', fontSize: 13, lineHeight: 19, marginTop: 13 },
});
