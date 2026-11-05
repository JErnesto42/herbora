import { ScrollView, StyleSheet, Text, View } from 'react-native';

const sections = [
  ['Uso tradicional', 'usoTradicional'],
  ['Como é preparada', 'preparo'],
  ['Compostos e química', 'compostos'],
  ['Cuidados', 'cuidados'],
  ['Combinações com outros ingredientes', 'combinacoes'],
];

export default function PlantDetailScreen({ route }) {
  const { plant } = route.params;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>{plant.categoria || 'GUIA DE PLANTAS'}</Text>
      <Text style={styles.title}>{plant.nomePopular}</Text>
      <Text style={styles.scientific}>{plant.nomeCientifico}</Text>
      <Text style={styles.summary}>{plant.resumo}</Text>
      {sections.map(([title, key]) => (
        <View key={key} style={styles.card}>
          <Text style={styles.heading}>{title}</Text>
          <Text style={styles.body}>{plant[key] || 'Informação ainda não cadastrada.'}</Text>
        </View>
      ))}
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
});
