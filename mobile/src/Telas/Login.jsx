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
import { buscarApi, obterDetalhesErro } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';
import { typography, spacing, borders, shadows } from '../styles/globalStyles';

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
});