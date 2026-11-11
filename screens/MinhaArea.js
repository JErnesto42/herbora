import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiRequest, getSessionToken } from '../services/api';

const views = [
  { key: 'favorites', label: 'Favoritos', endpoint: '/account/favorites', collection: 'plants' },
  { key: 'history', label: 'Histórico', endpoint: '/account/history', collection: 'plants' },
  { key: 'notes', label: 'Anotações', endpoint: '/account/notes', collection: 'notes' },
];

export default function PersonalAreaScreen({ navigation }) {
  const [selected, setSelected] = useState('favorites');
  const [items, setItems] = useState([]);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const sessionToken = await getSessionToken();
        if (!sessionToken) {
          setError('Entre na sua conta para acessar seus favoritos, histórico e anotações.');
          return;
        }
        await apiRequest('/auth/me', { token: sessionToken });
        if (!active) return;
        setToken(sessionToken);
      } catch (loadError) {
        if (active) setError(`Não foi possível carregar sua área: ${loadError.message}`);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSelectedItems() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const view = views.find((item) => item.key === selected);
        const result = await apiRequest(view.endpoint, { token });
        if (active) setItems(result[view.collection]);
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSelectedItems();
    return () => { active = false; };
  }, [selected, token]);

  function selectView(key) {
    setSelected(key);
  }

  async function removeFavorite(plantId) {
    try {
      await apiRequest(`/account/favorites/${plantId}`, { method: 'DELETE', token });
      const result = await apiRequest('/account/favorites', { token });
      setItems(result.plants);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  const selectedView = views.find((view) => view.key === selected);

  if (loading) return <ActivityIndicator color="#315b43" style={styles.loading} />;

  if (!token) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Minha área</Text>
        <Text style={styles.body}>{error}</Text>
        <Pressable style={styles.button} onPress={() => navigation.navigate('Minha conta')} accessibilityRole="button">
          <Text style={styles.buttonText}>Entrar ou criar conta</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>RECURSOS DA CONTA</Text>
      <Text style={styles.title}>Minha área</Text>
      <View style={styles.tabs}>
        {views.map((view) => (
          <Pressable
            key={view.key}
            style={[styles.tab, selected === view.key && styles.activeTab]}
            onPress={() => selectView(view.key)}
            accessibilityRole="button"
          >
            <Text style={[styles.tabText, selected === view.key && styles.activeTabText]}>{view.label}</Text>
          </Pressable>
        ))}
      </View>
      {loading && <ActivityIndicator color="#315b43" style={styles.inlineLoading} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
      {!loading && !items.length && <Text style={styles.body}>Ainda não há itens em {selectedView.label.toLowerCase()}.</Text>}
      {items.map((item) => {
        const plant = item.plant || item;
        return (
          <View key={plant.id} style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate('Detalhes', { plant })}
              accessibilityRole="button"
            >
              <Text style={styles.name}>{plant.nomePopular}</Text>
              <Text style={styles.scientific}>{plant.nomeCientifico}</Text>
              <Text style={styles.summary}>{plant.resumo}</Text>
              {selected === 'notes' && <Text style={styles.note}>{item.note}</Text>}
            </Pressable>
            {selected === 'favorites' && (
              <Pressable style={styles.removeButton} onPress={() => removeFavorite(plant.id)} accessibilityRole="button">
                <Text style={styles.removeButtonText}>Remover favorito</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, padding: 22, paddingBottom: 36, backgroundColor: '#f7f5ed' },
  loading: { flex: 1, backgroundColor: '#f7f5ed' },
  inlineLoading: { margin: 18 },
  eyebrow: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 8 },
  title: { color: '#203b2e', fontSize: 29, fontWeight: '800', marginTop: 9, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  tab: { flex: 1, alignItems: 'center', backgroundColor: '#e8eddf', borderRadius: 12, paddingVertical: 11 },
  activeTab: { backgroundColor: '#315b43' },
  tabText: { color: '#315b43', fontSize: 12, fontWeight: '700' },
  activeTabText: { color: '#fffefa' },
  card: { backgroundColor: '#fffefa', borderRadius: 16, padding: 16, marginTop: 11 },
  name: { color: '#203b2e', fontSize: 19, fontWeight: '800' },
  scientific: { color: '#66766a', fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  summary: { color: '#66766a', fontSize: 13, lineHeight: 19, marginTop: 8 },
  note: { color: '#526357', fontSize: 13, lineHeight: 19, marginTop: 10 },
  body: { color: '#66766a', fontSize: 14, lineHeight: 21, marginTop: 8 },
  button: { alignItems: 'center', backgroundColor: '#315b43', borderRadius: 13, padding: 14, marginTop: 18 },
  buttonText: { color: '#fffefa', fontWeight: '800' },
  removeButton: { alignSelf: 'flex-start', backgroundColor: '#f6e8df', borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginTop: 12 },
  removeButtonText: { color: '#80513c', fontSize: 12, fontWeight: '700' },
  error: { color: '#963d33', fontSize: 13, marginTop: 10 },
});
