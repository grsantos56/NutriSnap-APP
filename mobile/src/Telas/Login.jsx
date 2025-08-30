import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { buscarApi, obterDetalhesErro } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';
import { colors, typography, spacing, borders, shadows, componentStyles } from '../styles/globalStyles';

const { width, height } = Dimensions.get('window');

export default function TelaLogin({ navigation }) {
  const { entrar, conectado } = usarAutenticacao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Animações
  const animacaoFade = useRef(new Animated.Value(0)).current;
  const animacaoDeslizar = useRef(new Animated.Value(50)).current;
  const animacaoLogo = useRef(new Animated.Value(0)).current;
  const animacaoFormulario = useRef(new Animated.Value(30)).current;
  const animacaoBotao = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.timing(animacaoFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(animacaoDeslizar, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(animacaoLogo, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(animacaoFormulario, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Animação do botão após um delay
    setTimeout(() => {
      Animated.spring(animacaoBotao, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }, 800);
  }, []);

  // Validação de email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validação de senha
  const validarSenha = (senha) => {
    return senha.length >= 6;
  };

  // Validar formulário
  const validarFormulario = () => {
    if (!email.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, insira seu email');
      return false;
    }

    if (!validarEmail(email.trim())) {
      Alert.alert('Email inválido', 'Por favor, insira um email válido');
      return false;
    }

    if (!senha.trim()) {
      Alert.alert('Campo obrigatório', 'Por favor, insira sua senha');
      return false;
    }

    if (!validarSenha(senha)) {
      Alert.alert('Senha inválida', 'A senha deve ter pelo menos 6 caracteres');
      return false;
    }

    return true;
  };

  // Lidar com login
  async function lidarComLogin() {
    if (!validarFormulario()) return;

    // Verificar conectividade
    if (!conectado) {
      Alert.alert(
        'Sem conexão', 
        'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
        [
          { text: 'OK' },
          { text: 'Tentar novamente', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    setCarregando(true);

    try {
      const dados = await buscarApi('/api/autenticacao/entrar', { 
        method: 'POST', 
        body: { 
          email: email.trim().toLowerCase(), 
          senha 
        } 
      });

      await entrar(dados.token, dados.usuario);
      
      // Limpar campos
      setEmail('');
      setSenha('');
      
      // Navegar para tela principal
      navigation.replace('Principal');
      
    } catch (erro) {
      console.error('❌ Erro no login:', erro);
      
      let mensagem = 'Erro ao fazer login. Tente novamente.';
      
      if (erro.status === 401) {
        mensagem = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (erro.status === 404) {
        mensagem = 'Serviço de autenticação não disponível.';
      } else if (erro.status === 500) {
        mensagem = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (erro.message) {
        mensagem = erro.message;
      }

      // Mostrar detalhes do erro se disponível
      const detalhes = obterDetalhesErro(erro);
      if (detalhes && detalhes !== mensagem) {
        mensagem += `\n\nDetalhes: ${detalhes}`;
      }

      Alert.alert('Erro no Login', mensagem);
      
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      
      {/* Background com gradiente e elementos decorativos */}
      <View style={estilos.containerBackground}>
        <View style={estilos.circuloGradiente1} />
        <View style={estilos.circuloGradiente2} />
        <View style={estilos.circuloGradiente3} />
        <View style={estilos.elementosFlutuantes}>
          <View style={estilos.pontoFlutuante} />
          <View style={estilos.linhaFlutuante} />
          <View style={estilos.pontoFlutuante} />
        </View>
      </View>

      <KeyboardAvoidingView 
        style={estilos.containerTeclado} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={estilos.conteudoRolagem}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header com logo animado */}
          <Animated.View 
            style={[
              estilos.cabecalho,
              {
                opacity: animacaoFade,
                transform: [{ translateY: animacaoDeslizar }]
              }
            ]}
          >
            <Animated.View 
              style={[
                estilos.containerLogo,
                {
                  transform: [{ scale: animacaoLogo }]
                }
              ]}
            >
              <View style={estilos.brilhoLogo} />
              <View style={estilos.circuloLogo}>
                <MaterialIcons name="restaurant" size={40} color="#00C9FF" />
              </View>
              <Text style={estilos.textoLogo}>NutriSnap</Text>
            </Animated.View>
            
            <Text style={estilos.textoBoasVindas}>Bem-vindo de volta!</Text>

            {/* Indicador de conectividade - apenas quando desconectado */}
            {!conectado && (
              <View style={estilos.statusConexao}>
                <View style={[
                  estilos.pontoConexao, 
                  { backgroundColor: '#FF6B6B' }
                ]} />
                <Text style={[
                  estilos.textoConexao,
                  { color: '#FF6B6B' }
                ]}>
                  Servidor não acessível
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Formulário com animação */}
          <Animated.View 
            style={[
              estilos.containerFormulario,
              {
                opacity: animacaoFade,
                transform: [{ translateY: animacaoFormulario }]
              }
            ]}
          >
            <View style={estilos.grupoInput}>
              <Text style={estilos.rotuloInput}>Email</Text>
              <View style={estilos.wrapperInput}>
                <TextInput
                  style={[
                    estilos.input,
                    emailFocado && estilos.inputFocado,
                    email.trim() && !validarEmail(email.trim()) && estilos.inputErro
                  ]}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocado(true)}
                  onBlur={() => setEmailFocado(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!carregando}
                />
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={emailFocado ? "#00C9FF" : "rgba(255, 255, 255, 0.6)"} 
                  style={estilos.iconeInput}
                />
              </View>
              {email.trim() && !validarEmail(email.trim()) && (
                <Text style={estilos.textoErro}>Email deve ter formato válido</Text>
              )}
            </View>

            <View style={estilos.grupoInput}>
              <Text style={estilos.rotuloInput}>Senha</Text>
              <View style={estilos.wrapperInput}>
                <TextInput
                  style={[
                    estilos.input,
                    senhaFocada && estilos.inputFocado,
                    senha.trim() && !validarSenha(senha) && estilos.inputErro
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={senha}
                  onChangeText={setSenha}
                  onFocus={() => setSenhaFocada(true)}
                  onBlur={() => setSenhaFocada(false)}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  editable={!carregando}
                />
                <TouchableOpacity 
                  onPress={() => setMostrarSenha(!mostrarSenha)}
                  style={estilos.botaoIcone}
                  disabled={carregando}
                >
                  <MaterialIcons 
                    name={mostrarSenha ? "visibility" : "visibility-off"} 
                    size={20} 
                    color={senhaFocada ? "#00C9FF" : "rgba(255, 255, 255, 0.6)"} 
                  />
                </TouchableOpacity>
              </View>
              {senha.trim() && !validarSenha(senha) && (
                <Text style={estilos.textoErro}>Mínimo de 6 caracteres</Text>
              )}
            </View>

            <Animated.View
              style={{
                opacity: animacaoBotao,
                transform: [{ scale: animacaoBotao }]
              }}
            >
              <TouchableOpacity 
                onPress={lidarComLogin} 
                style={[
                  estilos.botaoLogin,
                  carregando && estilos.botaoDesabilitado
                ]}
                disabled={carregando || !conectado}
                activeOpacity={0.9}
              >
                <View style={estilos.gradienteBotao}>
                  {carregando ? (
                    <View style={estilos.botaoComCarregamento}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={estilos.textoBotaoLogin}>Entrando...</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={estilos.textoBotaoLogin}>Entrar</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Links de navegação */}
          <Animated.View 
            style={[
              estilos.containerNavegacao,
              {
                opacity: animacaoFade,
                transform: [{ translateY: animacaoDeslizar }]
              }
            ]}
          >
            <TouchableOpacity 
              onPress={() => navigation.navigate('Register')}
              style={estilos.linkNavegacao}
              disabled={carregando}
            >
              <Text style={estilos.textoLinkNavegacao}>Não tem conta? Cadastre-se</Text>
            </TouchableOpacity>
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