import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { plantasDemonstracao } from '../data/plantas';
import { apiRequest } from '../services/api';

const colors = { ink: '#203b2e', muted: '#66766a', green: '#315b43', cream: '#f7f5ed', white: '#fffefa', pale: '#e8eddf' };

export default function PlantsScreen({ navigation }) {
  const [plants, setPlants] = useState(plantasDemonstracao);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/plants')
      .then(({ plants: results }) => {
        if (active && Array.isArray(results)) {
          setPlants(results);
          setApiMessage('');
        }
      })
      .catch(() => {
        if (active) setApiMessage('API indisponível: exibindo conteúdo demonstrativo. Confira a conexão e o endereço da API.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filteredPlants = plants.filter((plant) =>
    `${plant.nomePopular} ${plant.nomeCientifico}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>ATLAS BOTÂNICO</Text>
      <Text style={styles.title}>Plantas para conhecer</Text>
      <Text style={styles.subtitle}>Explore usos tradicionais, preparo, compostos e cuidados.</Text>
      <TextInput
        accessibilityLabel="Buscar planta"
        placeholder="Buscar por nome popular ou científico"
        placeholderTextColor="#829087"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      {loading && <ActivityIndicator color={colors.green} style={styles.loading} />}
      {!!apiMessage && <Text style={styles.apiMessage}>{apiMessage}</Text>}
      {filteredPlants.map((plant) => (
        <Pressable
          key={plant.id}
          style={styles.card}
          onPress={() => navigation.navigate('Detalhes', { plant })}
          accessibilityRole="button"
        >
          <Text style={styles.category}>{plant.categoria || 'PLANTA'}  ↗</Text>
          <Text style={styles.name}>{plant.nomePopular}</Text>
          <Text style={styles.scientific}>{plant.nomeCientifico}</Text>
          <Text style={styles.summary}>{plant.resumo}</Text>
          <Text style={styles.link}>Ver informações →</Text>
        </Pressable>
      ))}
      {!filteredPlants.length && <Text style={styles.empty}>Nenhuma planta encontrada.</Text>}
      <Text style={styles.disclaimer}>Informações educativas; não constituem recomendação médica.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 34, backgroundColor: colors.cream },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 9 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', marginTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  search: { backgroundColor: colors.white, borderColor: '#dce3d8', borderRadius: 14, borderWidth: 1, color: colors.ink, padding: 14, marginTop: 20 },
  loading: { margin: 15 },
  apiMessage: { color: '#795b25', backgroundColor: '#f0e9d8', borderRadius: 12, padding: 12, marginTop: 13, lineHeight: 18, fontSize: 12 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, marginTop: 14 },
  category: { color: colors.green, backgroundColor: colors.pale, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 9, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, alignSelf: 'flex-start', overflow: 'hidden' },
  name: { color: colors.ink, fontSize: 22, fontWeight: '800', marginTop: 12 },
  scientific: { color: colors.muted, fontSize: 13, fontStyle: 'italic', marginTop: 3 },
  summary: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  link: { color: colors.green, fontSize: 13, fontWeight: '700', marginTop: 15 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 28 },
  disclaimer: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 22 },
});
