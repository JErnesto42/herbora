import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { apiRequest, clearSessionToken, getSessionToken, saveSessionToken } from '../services/api';

export default function AccountScreen({ navigation }) {
  const [mode, setMode] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [session, setSession] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await getSessionToken();
        if (token) {
          const result = await apiRequest('/auth/me', { token });
          setSession({ token, user: result.user });
        }
      } catch (error) {
        setMessage(`Não foi possível restaurar a sessão: ${error.message}`);
      } finally {
        setCheckingSession(false);
      }
    }
    restoreSession();
  }, []);

  async function submit() {
    setMessage('');
    setBusy(true);
    try {
      const path = mode === 'register' ? '/auth/register' : '/auth/login';
      const body = mode === 'register'
        ? { name: name.trim(), email: email.trim(), password, privacyConsent }
        : { email: email.trim(), password };
      const result = await apiRequest(path, { method: 'POST', body });
      await saveSessionToken(result.token);
      setSession(result);
      setPassword('');
      setMessage(mode === 'register' ? 'Cadastro realizado com sucesso.' : 'Login realizado com sucesso.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    setMessage('');
    setBusy(true);
    try {
      const result = await apiRequest('/auth/me', {
        method: 'PUT',
        body: { name: name.trim(), email: email.trim() },
        token: session.token,
      });
      setSession((current) => ({ ...current, user: result.user }));
      setEditingProfile(false);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await clearSessionToken();
      setSession(null);
      setMessage('Você saiu da sua conta.');
    } catch {
      setMessage('Não foi possível encerrar a sessão neste dispositivo.');
    }
  }

  if (checkingSession) {
    return <ActivityIndicator color="#315b43" style={styles.loading} />;
  }

  if (session) {
    return (
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>SUA CONTA</Text>
        <Text style={styles.title}>Olá, {session.user.name}</Text>
        <Text style={styles.role}>
          {session.user.role === 'admin' ? 'ADMINISTRADOR' : 'USUÁRIO COM CONTA'}
        </Text>
        <Text style={styles.description}>Sua sessão está ativa neste dispositivo.</Text>
        {editingProfile ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#829087"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#829087"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable
              style={[styles.primaryButton, busy && styles.disabled]}
              onPress={saveProfile}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? <ActivityIndicator color="#fffefa" /> : <Text style={styles.primaryText}>Salvar perfil</Text>}
            </Pressable>
            <Pressable onPress={() => setEditingProfile(false)} accessibilityRole="button">
              <Text style={styles.switch}>Cancelar edição</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setName(session.user.name);
              setEmail(session.user.email);
              setEditingProfile(true);
              setMessage('');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Ver e editar meu perfil</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Minha área')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>Meus favoritos, histórico e anotações</Text>
        </Pressable>
        {session.user.role === 'admin' && (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Gerenciar plantas')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>Gerenciar catálogo de plantas</Text>
          </Pressable>
        )}
        <Pressable style={styles.secondaryButton} onPress={logout} accessibilityRole="button">
          <Text style={styles.secondaryText}>Sair da conta</Text>
        </Pressable>
        {!!message && <Text style={styles.message}>{message}</Text>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>COMUNIDADE HERBORA</Text>
      <Text style={styles.title}>{mode === 'register' ? 'Crie sua conta' : 'Boas-vindas de volta'}</Text>
      <Text style={styles.description}>Salve seu acesso para acompanhar o universo das plantas.</Text>
      {mode === 'register' && (
        <TextInput style={styles.input} placeholder="Seu nome" placeholderTextColor="#829087" value={name} onChangeText={setName} autoCapitalize="words" />
      )}
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#829087" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <TextInput style={styles.input} placeholder="Senha (mínimo 8 caracteres)" placeholderTextColor="#829087" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
      {mode === 'register' && (
        <Pressable
          style={styles.consent}
          onPress={() => setPrivacyConsent(!privacyConsent)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: privacyConsent }}
        >
          <Text style={styles.checkbox}>{privacyConsent ? '☑' : '□'}</Text>
          <Text style={styles.consentText}>
            Concordo com o armazenamento do meu nome, e-mail, favoritos, histórico e anotações para manter os recursos da minha conta.
          </Text>
        </Pressable>
      )}
      <Pressable style={[styles.primaryButton, busy && styles.disabled]} onPress={submit} disabled={busy} accessibilityRole="button">
        {busy ? <ActivityIndicator color="#fffefa" /> : <Text style={styles.primaryText}>{mode === 'register' ? 'Cadastrar' : 'Entrar'}</Text>}
      </Pressable>
      <Pressable onPress={() => { setMode(mode === 'register' ? 'login' : 'register'); setMessage(''); }} accessibilityRole="button">
        <Text style={styles.switch}>{mode === 'register' ? 'Já tem conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}</Text>
      </Pressable>
      {!!message && <Text style={styles.message}>{message}</Text>}
      <Text style={styles.privacy}>Sua senha é protegida por hash no servidor. Nunca compartilhe sua senha.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: '#f7f5ed', padding: 23, paddingTop: 35 },
  eyebrow: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#203b2e', fontSize: 29, fontWeight: '800', marginTop: 9 },
  description: { color: '#66766a', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18 },
  role: { color: '#315b43', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 12 },
  input: { backgroundColor: '#fffefa', borderColor: '#dce3d8', borderRadius: 13, borderWidth: 1, color: '#203b2e', padding: 14, marginTop: 11 },
  consent: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  checkbox: { color: '#315b43', fontSize: 22, marginRight: 10 },
  consentText: { color: '#526357', flex: 1, fontSize: 12, lineHeight: 18 },
  primaryButton: { alignItems: 'center', backgroundColor: '#315b43', borderRadius: 14, padding: 15, marginTop: 18 },
  primaryText: { color: '#fffefa', fontWeight: '800' },
  disabled: { opacity: 0.7 },
  secondaryButton: { alignItems: 'center', backgroundColor: '#315b43', borderRadius: 14, padding: 15, marginTop: 22 },
  secondaryText: { color: '#fffefa', fontWeight: '800' },
  switch: { color: '#315b43', textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 19 },
  message: { color: '#315b43', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 16 },
  privacy: { color: '#66766a', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 25 },
  loading: { flex: 1, backgroundColor: '#f7f5ed' },
});
