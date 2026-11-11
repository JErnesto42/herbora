import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiRequest, getSessionToken } from '../services/api';

const sections = [
  ['Como é preparada', 'preparo'],
  ['Compostos e química', 'compostos'],
  ['Combinações com outros ingredientes', 'combinacoes'],
];

export default function PlantDetailScreen({ route, navigation }) {
  const [plant, setPlant] = useState(route.params.plant);
  const [token, setToken] = useState(null);
  const [member, setMember] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    async function loadPlant() {
      setLoading(true);
      setMessage('');
      try {
        const sessionToken = await getSessionToken();
        const result = await apiRequest(`/plants/${route.params.plant.id}`, {
          ...(sessionToken ? { token: sessionToken } : {}),
        });
        if (active) {
          setPlant(result.plant);
          if (sessionToken) {
            setToken(sessionToken);
            setMember(true);
            try {
              const accountState = await apiRequest(`/account/plants/${route.params.plant.id}`, {
                token: sessionToken,
              });
              await apiRequest(`/account/history/${route.params.plant.id}`, {
                method: 'POST',
                token: sessionToken,
              });
              if (active) {
                setFavorite(accountState.favorite);
                setNote(accountState.note);
              }
            } catch (error) {
              if (active) setMessage(`Não foi possível carregar os recursos da conta: ${error.message}`);
            }
          } else {
            setToken(null);
            setMember(false);
            setFavorite(false);
            setNote('');
          }
        }
      } catch (error) {
        if (active) setMessage(`Não foi possível carregar todas as informações: ${error.message}`);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPlant();
    return () => { active = false; };
  }, [route.params.plant.id]));

  async function toggleFavorite() {
    setMessage('');
    try {
      await apiRequest(`/account/favorites/${plant.id}`, {
        method: favorite ? 'DELETE' : 'POST',
        token,
      });
      setFavorite(!favorite);
      setMessage(favorite ? 'Removida dos favoritos.' : 'Salva nos favoritos.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveNote() {
    setMessage('');
    setSavingNote(true);
    try {
      if (note.trim()) {
        const result = await apiRequest(`/account/notes/${plant.id}`, {
          method: 'PUT',
          body: { note },
          token,
        });
        setMessage(result.message);
      } else {
        const result = await apiRequest(`/account/notes/${plant.id}`, {
          method: 'DELETE',
          token,
        });
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {loading && <ActivityIndicator color="#315b43" style={styles.loading} />}
      <Text style={styles.eyebrow}>{plant.categoria || 'GUIA DE PLANTAS'}</Text>
      <Text style={styles.title}>{plant.nomePopular}</Text>
      <Text style={styles.scientific}>{plant.nomeCientifico}</Text>
      <Text style={styles.summary}>{plant.resumo}</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Usos e benefícios tradicionais</Text>
        <Text style={styles.body}>{plant.usoTradicional || 'Informação ainda não cadastrada.'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.heading}>Contraindicações e cuidados</Text>
        <Text style={styles.body}>{plant.cuidados || 'Informação ainda não cadastrada.'}</Text>
      </View>
      {member && sections.map(([title, key]) => (
        <View key={key} style={styles.card}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.body}>{plant[key] || 'Informação ainda não cadastrada.'}</Text>
        </View>
      ))}
      {member ? (
        <View style={styles.memberCard}>
          <Pressable style={styles.memberButton} onPress={toggleFavorite} accessibilityRole="button">
            <Text style={styles.memberButtonText}>{favorite ? '★ Remover dos favoritos' : '☆ Salvar nos favoritos'}</Text>
          </Pressable>
          <Text style={styles.heading}>Minha anotação</Text>
          <TextInput
            accessibilityLabel="Anotação pessoal da planta"
            style={styles.noteInput}
            multiline
            textAlignVertical="top"
            placeholder="Escreva uma anotação pessoal sobre esta planta..."
            placeholderTextColor="#829087"
            value={note}
            onChangeText={setNote}
            maxLength={4000}
          />
          <Pressable
            style={[styles.memberButton, savingNote && styles.disabled]}
            onPress={saveNote}
            disabled={savingNote}
            accessibilityRole="button"
          >
            {savingNote ? <ActivityIndicator color="#fffefa" /> : <Text style={styles.memberButtonText}>Salvar anotação</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.memberCard}>
          <Text style={styles.heading}>Mais recursos com uma conta</Text>
          <Text style={styles.body}>Entre para salvar favoritos, consultar seu histórico e escrever anotações pessoais.</Text>
          <Pressable style={styles.memberButton} onPress={() => navigation.navigate('Minha conta')} accessibilityRole="button">
            <Text style={styles.memberButtonText}>Entrar ou criar conta</Text>
          </Pressable>
        </View>
      )}
      {!!message && <Text style={styles.message}>{message}</Text>}
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Antes de consumir</Text>
        <Text style={styles.body}>
          Este material é educativo e não substitui orientação profissional. A segurança pode variar
          conforme a espécie, a preparação, a idade, a gestação, condições de saúde e medicamentos.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 35, backgroundColor: '#f7f5ed' },
  eyebrow: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#203b2e', fontSize: 34, fontWeight: '800', marginTop: 9 },
  scientific: { color: '#66766a', fontSize: 15, fontStyle: 'italic', marginTop: 4 },
  summary: { color: '#66766a', fontSize: 15, lineHeight: 22, marginTop: 14, marginBottom: 8 },
  card: { backgroundColor: '#fffefa', borderRadius: 17, padding: 17, marginTop: 12 },
  heading: { color: '#315b43', fontSize: 15, fontWeight: '800' },
  body: { color: '#526357', fontSize: 13, lineHeight: 20, marginTop: 7 },
  notice: { backgroundColor: '#f0e9d8', borderRadius: 16, padding: 17, marginTop: 16 },
  noticeTitle: { color: '#203b2e', fontSize: 14, fontWeight: '800' },
  loading: { marginVertical: 8 },
  memberCard: { backgroundColor: '#e8eddf', borderRadius: 16, padding: 17, marginTop: 16 },
  memberButton: { alignItems: 'center', backgroundColor: '#315b43', borderRadius: 12, padding: 13, marginBottom: 15 },
  memberButtonText: { color: '#fffefa', fontSize: 13, fontWeight: '800' },
  noteInput: { backgroundColor: '#fffefa', borderColor: '#dce3d8', borderRadius: 12, borderWidth: 1, color: '#203b2e', minHeight: 100, padding: 12, marginTop: 10, marginBottom: 12 },
  disabled: { opacity: 0.7 },
  message: { color: '#315b43', fontSize: 13, lineHeight: 19, marginTop: 12 },
});
