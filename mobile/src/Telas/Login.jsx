import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { buscarApi, obterDetalhesErro } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';
import { typography, spacing, borders, shadows } from '../styles/globalStyles';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

export default function TelaLogin({ navigation }) {
  const { entrar, conectado } = usarAutenticacao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Animações
  const animFade = useRef(new Animated.Value(0)).current;
  const animSlide = useRef(new Animated.Value(50)).current;
  const animLogo = useRef(new Animated.Value(0)).current;
  const animForm = useRef(new Animated.Value(30)).current;
  const animBotao = useRef(new Animated.Value(0)).current;

  const isWeb = Platform.OS === 'web';

  // Configuração do Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Platform.select({
      web: '1028772176202-111ftj99ppitr6f168g72qjh4kkbrumg.apps.googleusercontent.com',
      android: '1028772176202-4sdj5b9eccnpg9kp0ol66bqc0e2kinlo.apps.googleusercontent.com',
      ios: '1028772176202-a2mf4jm85645elcc63pbc5f6kb6rbl90.apps.googleusercontent.com',
      default: '1028772176202-4sdj5b9eccnpg9kp0ol66bqc0e2kinlo.apps.googleusercontent.com'
    }),
    redirectUri: makeRedirectUri({
      useProxy: true, // necessário no Expo Go
    }),
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(animSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.spring(animLogo, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.spring(animForm, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.spring(animBotao, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
    }, 800);
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      loginComGoogle(id_token);
    }
  }, [response]);

  async function loginComGoogle(idToken) {
    try {
      setCarregando(true);
      const dados = await buscarApi('/api/usuarios/login/google', {
        method: 'POST',
        body: { idToken },
      });
      await entrar(dados.token, dados.usuario);
      navigation.replace('Principal');
    } catch (erro) {
      Alert.alert('Erro Google', 'Não foi possível fazer login com Google.');
      console.error(erro);
    } finally {
      setCarregando(false);
    }
  }

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validarSenha = (senha) => senha.length >= 6;

  const validarFormulario = () => {
    if (!email.trim()) return Alert.alert('Campo obrigatório', 'Insira seu email'), false;
    if (!validarEmail(email.trim())) return Alert.alert('Email inválido', 'Insira um email válido'), false;
    if (!senha.trim()) return Alert.alert('Campo obrigatório', 'Insira sua senha'), false;
    if (!validarSenha(senha)) return Alert.alert('Senha inválida', 'Mínimo 6 caracteres'), false;
    return true;
  };

  async function lidarComLogin() {
    if (!validarFormulario()) return;

    if (!conectado) {
      return Alert.alert('Sem conexão', 'Servidor inacessível. Verifique internet.', [
        { text: 'OK' },
        { text: 'Tentar novamente', onPress: () => navigation.navigate('Login') },
      ]);
    }

    setCarregando(true);
    try {
      const dados = await buscarApi('/api/autenticacao/entrar', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), senha },
      });
      await entrar(dados.token, dados.usuario);
      setEmail('');
      setSenha('');
      navigation.replace('Principal');
    } catch (erro) {
      const msg = obterDetalhesErro(erro) || 'Falha ao autenticar';
      Alert.alert('Erro no login', msg);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg }} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <Animated.View style={{ alignItems: 'center', paddingTop: height * 0.08, opacity: animFade, transform: [{ translateY: animSlide }] }}>
            <Animated.View style={{ transform: [{ scale: animLogo }], alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,201,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <MaterialIcons name="restaurant" size={40} color="#00C9FF" />
              </View>
              <Text style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.black, color: '#fff' }}>NutriSnap</Text>
            </Animated.View>
            <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: '#fff', textAlign: 'center' }}>Bem-vindo de volta!</Text>
            {!conectado && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6B6B', marginRight: spacing.sm }} />
                <Text style={{ color: '#FF6B6B' }}>Servidor não acessível</Text>
              </View>
            )}
          </Animated.View>

          {/* Formulário */}
          <Animated.View style={{ marginTop: spacing.lg, opacity: animFade, transform: [{ translateY: animForm }] }}>
            {/* Email */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ color: '#fff', marginBottom: spacing.xs }}>Email</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: spacing.md, paddingRight: 50, borderRadius: borders.radius.xl, color: '#fff' }}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocado(true)}
                  onBlur={() => setEmailFocado(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!carregando}
                />
                <MaterialIcons name="email" size={20} color={emailFocado ? "#00C9FF" : "rgba(255,255,255,0.6)"} style={{ position: 'absolute', right: spacing.lg, top: '50%', marginTop: -10 }} />
              </View>
            </View>

            {/* Senha */}
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ color: '#fff', marginBottom: spacing.xs }}>Senha</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', padding: spacing.md, paddingRight: 50, borderRadius: borders.radius.xl, color: '#fff' }}
                  placeholder="••••••"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={senha}
                  onChangeText={setSenha}
                  onFocus={() => setSenhaFocada(true)}
                  onBlur={() => setSenhaFocada(false)}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  editable={!carregando}
                />
                <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={{ position: 'absolute', right: spacing.lg, top: '50%', marginTop: -10 }}>
                  <MaterialIcons name={mostrarSenha ? "visibility" : "visibility-off"} size={20} color={senhaFocada ? "#00C9FF" : "rgba(255,255,255,0.6)"} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões */}
            <Animated.View style={{ opacity: animBotao, transform: [{ scale: animBotao }] }}>
              <TouchableOpacity onPress={lidarComLogin} style={{ backgroundColor: '#00C9FF', padding: spacing.md, borderRadius: borders.radius.full, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.sm }} disabled={carregando || !conectado}>
                {carregando ? <ActivityIndicator color="#fff" /> : <><Text style={{ color: '#fff', fontWeight: 'bold' }}>Entrar</Text><MaterialIcons name="arrow-forward" size={20} color="#fff" /></>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => promptAsync()} style={{ backgroundColor: '#DB4437', padding: spacing.md, borderRadius: borders.radius.full, alignItems: 'center' }} disabled={!request || carregando}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Entrar com Google</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Cadastro */}
            <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: '#00C9FF' }}>Não tem conta? Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  containerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  circuloGradiente1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 201, 255, 0.1)',
  },

  circuloGradiente2: {
    position: 'absolute',
    bottom: -150,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },

  circuloGradiente3: {
    position: 'absolute',
    top: height * 0.4,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 209, 61, 0.06)',
  },

  elementosFlutuantes: {
    position: 'absolute',
    top: height * 0.6,
    left: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  pontoFlutuante: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },

  linhaFlutuante: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  containerTeclado: {
    flex: 1,
  },
  
  conteudoRolagem: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  
  cabecalho: {
    alignItems: 'center',
    paddingTop: height * 0.08,
    paddingBottom: spacing.xl,
  },
  
  containerLogo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    position: 'relative',
  },

  brilhoLogo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 201, 255, 0.2)',
    zIndex: -1,
  },
  
  circuloLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 201, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(0, 201, 255, 0.3)',
    ...shadows.lg,
  },
  
  textoLogo: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.black,
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  
  textoBoasVindas: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  
  textoSubtitulo: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  
  statusConexao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borders.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  pontoConexao: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  textoConexao: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  containerFormulario: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  
  grupoInput: {
    gap: spacing.sm,
  },
  
  rotuloInput: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  wrapperInput: {
    position: 'relative',
  },
  
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borders.radius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl + 20, // Espaço para o ícone
    borderWidth: borders.width.thin,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontSize: typography.fontSize.base,
    color: '#FFFFFF',
    ...shadows.base,
  },

  iconeInput: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -10,
  },

  botaoIcone: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    marginTop: -10,
    padding: spacing.xs,
  },
  
  inputFocado: {
    borderColor: '#00C9FF',
    borderWidth: borders.width.base,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    ...shadows.lg,
  },
  
  inputErro: {
    borderColor: '#FF6B6B',
    borderWidth: borders.width.base,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  
  textoErro: {
    fontSize: typography.fontSize.sm,
    color: '#FF6B6B',
    marginLeft: spacing.sm,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  botaoLogin: {
    borderRadius: borders.radius.full,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.xl,
    elevation: 15,
  },

  gradienteBotao: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#00C9FF',
  },
  
  botaoDesabilitado: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    ...shadows.sm,
  },
  
  botaoComCarregamento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  
  textoBotaoLogin: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  containerNavegacao: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  
  linkNavegacao: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borders.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  textoLinkNavegacao: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#00C9FF',
    textDecorationLine: 'none',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});