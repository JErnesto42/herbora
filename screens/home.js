import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = {
  ink: '#203b2e',
  muted: '#66766a',
  green: '#315b43',
  cream: '#f7f5ed',
  pale: '#e8eddf',
  white: '#fffefa',
};

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <StatusBar style="dark" />
      <View style={styles.topbar}>
        <Text style={styles.brand}>HERBORA</Text>
        <Pressable onPress={() => navigation.navigate('Minha conta')} accessibilityRole="button">
          <Text style={styles.account}>Minha conta</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>CONHECIMENTO QUE FLORESCE</Text>
        <Text style={styles.title}>A natureza também merece ser estudada.</Text>
        <Text style={styles.copy}>
          Um guia educativo sobre plantas, preparo tradicional, cuidados e os compostos presentes
          em cada infusão.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Plantas')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Explorar plantas  →</Text>
        </Pressable>
        <Text style={styles.leaf}>✳</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.eyebrow}>UM GUIA PARA CONSULTAR</Text>
        <Text style={styles.sectionTitle}>Mais do que uma xícara</Text>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>☘</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Conheça cada planta</Text>
            <Text style={styles.featureCopy}>Nomes populares, compostos e usos tradicionais.</Text>
          </View>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>◌</Text>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Entenda os cuidados</Text>
            <Text style={styles.featureCopy}>Informações educativas e atenção a interações.</Text>
          </View>
        </View>
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Informação responsável</Text>
        <Text style={styles.noticeCopy}>
          Conteúdo educativo: plantas e chás não substituem avaliação ou tratamento de saúde.
          Consulte um profissional antes de usar plantas para fins medicinais.
        </Text>
      </View>
      <Text style={styles.footer}>HERBORA · CULTIVANDO CURIOSIDADE</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 36, backgroundColor: colors.cream },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  brand: { color: colors.green, fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  account: { color: colors.green, fontWeight: '700' },
  hero: { backgroundColor: colors.pale, borderRadius: 28, padding: 25, minHeight: 310, overflow: 'hidden' },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 34, fontWeight: '800', lineHeight: 40, marginTop: 16, maxWidth: 330 },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12, maxWidth: 330 },
  primaryButton: { backgroundColor: colors.green, borderRadius: 14, alignSelf: 'flex-start', marginTop: 22, paddingVertical: 14, paddingHorizontal: 18 },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  leaf: { position: 'absolute', right: 12, bottom: 8, color: '#c9d6c1', fontSize: 116 },
  section: { paddingTop: 32 },
  sectionTitle: { color: colors.ink, fontSize: 24, fontWeight: '800', marginTop: 7, marginBottom: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 17, padding: 16, marginTop: 10 },
  featureIcon: { color: colors.green, fontSize: 27, width: 43 },
  featureText: { flex: 1 },
  featureTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  featureCopy: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  notice: { backgroundColor: '#f0e9d8', borderRadius: 16, padding: 17, marginTop: 22 },
  noticeTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  noticeCopy: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 9, fontWeight: '700', letterSpacing: 1.7, marginTop: 25 },
});