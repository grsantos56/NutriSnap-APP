import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { buscarApi, obterDetalhesErro } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';
import { typography, spacing, borders, shadows } from '../styles/globalStyles';

const { height } = Dimensions.get('window');

export default function TelaRegistro({ navigation }) {
    const { conectado } = usarAutenticacao();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [nomeFocado, setNomeFocado] = useState(false);
    const [emailFocado, setEmailFocado] = useState(false);
    const [senhaFocada, setSenhaFocada] = useState(false);
    const [confirmarSenhaFocada, setConfirmarSenhaFocada] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

    // Animações
    const animacaoFade = useRef(new Animated.Value(0)).current;
    const animacaoDeslizar = useRef(new Animated.Value(50)).current;
    const animacaoLogo = useRef(new Animated.Value(0)).current;
    const animacaoFormulario = useRef(new Animated.Value(30)).current;
    const animacaoBotao = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(animacaoFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(animacaoDeslizar, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
            Animated.spring(animacaoLogo, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
            Animated.spring(animacaoFormulario, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            Animated.spring(animacaoBotao, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
        }, 800);
    }, []);

    // Validações
    const validarNome = (nome) => {
        const nomeLimpo = nome.trim();
        if (nomeLimpo.length < 2 || nomeLimpo.length > 100) return false;
        const regex = /^[a-zA-ZÀ-ÿ\s]+$/;
        return regex.test(nomeLimpo);
    };

    const validarEmail = (email) => {
        const emailLimpo = email.trim().toLowerCase();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailLimpo);
    };

    const validarSenha = (senha) => {
        if (senha.length < 6 || senha.length > 255) return false;
        const temMaiuscula = /[A-Z]/.test(senha);
        const temMinuscula = /[a-z]/.test(senha);
        const temNumero = /\d/.test(senha);
        return temMaiuscula && temMinuscula && temNumero;
    };

    const validarFormulario = () => {
        if (!nome.trim()) {
            Alert.alert('Campo obrigatório', 'Por favor, insira seu nome completo');
            return false;
        }
        if (!validarNome(nome)) {
            Alert.alert('Nome inválido', 'Nome deve ter entre 2 e 100 caracteres e conter apenas letras e espaços');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Campo obrigatório', 'Por favor, insira seu email');
            return false;
        }
        if (!validarEmail(email)) {
            Alert.alert('Email inválido', 'Por favor, insira um email válido');
            return false;
        }
        if (!senha) {
            Alert.alert('Campo obrigatório', 'Por favor, insira uma senha');
            return false;
        }
        if (!validarSenha(senha)) {
            Alert.alert('Senha inválida', 'Senha deve ter entre 6 e 255 caracteres, com pelo menos uma letra maiúscula, uma minúscula e um número');
            return false;
        }
        if (senha !== confirmarSenha) {
            Alert.alert('Senhas não coincidem', 'A confirmação de senha deve ser igual à senha');
            return false;
        }
        return true;
    };

    async function lidarComRegistro() {
        if (!validarFormulario()) return;

        if (!conectado) {
            Alert.alert(
                'Sem conexão', 
                'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
                [{ text: 'OK' }]
            );
            return;
        }

        setCarregando(true);
        const emailLowerCase = email.trim().toLowerCase();

        try {
            // 1. Chamar a rota de REGISTRO (ARAMAZENA PENDÊNCIA)
            await buscarApi('/api/autenticacao/registrar', { 
                method: 'POST', 
                body: { 
                    nome: nome.trim(),
                    email: emailLowerCase, 
                    senha 
                } 
            });
            
            // 2. Tentar ENVIAR O CÓDIGO (Bloco Isolado)
            try {
                await buscarApi('/api/autenticacao/enviar-codigo', {
                    method: 'POST',
                    body: { email: emailLowerCase }
                });
                

            } catch (erroEnvio) {
                // Falha no Envio do Código
                let mensagemEnvio = obterDetalhesErro(erroEnvio) || 'Erro interno ao tentar enviar o código de verificação.';
                
                // Opcional: Manter um alerta AVISANDO sobre a falha de envio para que o usuário saiba que precisa reenviar.
                Alert.alert(
                    'Atenção',
                    `Sua conta foi criada, mas houve um erro no envio do código: ${mensagemEnvio} Use a opção 'Reenviar Código' na próxima tela.`,
                    [{ text: 'Continuar', onPress: () => console.warn('Erro isolado no envio de código:', erroEnvio) }]
                );
            }
            
            // 3. Navegar para a tela de Verificação
            setNome('');
            setEmail('');
            setSenha('');
            setConfirmarSenha('');
            
            // Redireciona imediatamente
            navigation.replace('VerificarEmail', { email: emailLowerCase }); 

        } catch (erroRegistro) {
            // Trata erros no /registrar (ex: Email já cadastrado)
            let mensagem = obterDetalhesErro(erroRegistro) || 'Erro ao criar conta. Tente novamente.';
            
            if (erroRegistro.status === 409) {
                mensagem = 'Este email já está cadastrado. Use outro email ou faça login.';
            } 
            
            Alert.alert('Erro no Registro', mensagem);
            
        } finally {
            setCarregando(false);
        }
    }

    return (
        <View style={estilos.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            
            <View style={estilos.containerFundo}>
                <View style={estilos.circuloGradiente1} />
                <View style={estilos.circuloGradiente2} />
                <View style={estilos.circuloGradiente3} />
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
                        
                        <Text style={estilos.textoBoasVindas}>Junte-se a nós!</Text>
                        <Text style={estilos.textoSubtitulo}>Crie sua conta e comece sua jornada para uma vida mais saudável</Text>
                        
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
        
                    <Animated.View 
                        style={[
                            estilos.containerFormulario,
                            {
                                opacity: animacaoFade,
                                transform: [{ translateY: animacaoFormulario }]
                            }
                        ]}
                    >
                        <View style={estilos.grupoEntrada}>
                            <Text style={estilos.rotuloEntrada}>Nome completo</Text>
                            <View style={estilos.involucroEntrada}>
                                <TextInput
                                    style={[
                                        estilos.entrada,
                                        nomeFocado && estilos.entradaFocada,
                                        nome.trim() && !validarNome(nome) && estilos.entradaErro
                                    ]}
                                    placeholder="Seu nome completo"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={nome}
                                    onChangeText={setNome}
                                    onFocus={() => setNomeFocado(true)}
                                    onBlur={() => setNomeFocado(false)}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    editable={!carregando}
                                />
                                <MaterialIcons 
                                    name="person" 
                                    size={20} 
                                    color={nomeFocado ? "#00C9FF" : "rgba(255, 255, 255, 0.6)"} 
                                    style={estilos.iconeEntrada}
                                />
                            </View>
                            {nome.trim() && !validarNome(nome) && (
                                <Text style={estilos.textoErro}>Nome deve ter entre 2 e 100 caracteres</Text>
                            )}
                        </View>
        
                        <View style={estilos.grupoEntrada}>
                            <Text style={estilos.rotuloEntrada}>Email</Text>
                            <View style={estilos.involucroEntrada}>
                                <TextInput
                                    style={[
                                        estilos.entrada,
                                        emailFocado && estilos.entradaFocada,
                                        email.trim() && !validarEmail(email) && estilos.entradaErro
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
                                    style={estilos.iconeEntrada}
                                />
                            </View>
                            {email.trim() && !validarEmail(email) && (
                                <Text style={estilos.textoErro}>Email deve ter formato válido</Text>
                            )}
                        </View>
        
                        <View style={estilos.grupoEntrada}>
                            <Text style={estilos.rotuloEntrada}>Senha</Text>
                            <View style={estilos.involucroEntrada}>
                                <TextInput
                                    style={[
                                        estilos.entrada,
                                        senhaFocada && estilos.entradaFocada,
                                        senha && !validarSenha(senha) && estilos.entradaErro
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
                            {senha && !validarSenha(senha) && (
                                <Text style={estilos.textoErro}>Mínimo 6 caracteres, com maiúscula, minúscula e número</Text>
                            )}
                        </View>
        
                        <View style={estilos.grupoEntrada}>
                            <Text style={estilos.rotuloEntrada}>Confirmar senha</Text>
                            <View style={estilos.involucroEntrada}>
                                <TextInput
                                    style={[
                                        estilos.entrada,
                                        confirmarSenhaFocada && estilos.entradaFocada,
                                        confirmarSenha && senha !== confirmarSenha && estilos.entradaErro
                                    ]}
                                    placeholder="••••••••"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={confirmarSenha}
                                    onChangeText={setConfirmarSenha}
                                    onFocus={() => setConfirmarSenhaFocada(true)}
                                    onBlur={() => setConfirmarSenhaFocada(false)}
                                    secureTextEntry={!mostrarConfirmarSenha}
                                    autoCapitalize="none"
                                    editable={!carregando}
                                />
                                <TouchableOpacity 
                                    onPress={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
                                    style={estilos.botaoIcone}
                                    disabled={carregando}
                                >
                                    <MaterialIcons 
                                        name={mostrarConfirmarSenha ? "visibility" : "visibility-off"} 
                                        size={20} 
                                        color={confirmarSenhaFocada ? "#00C9FF" : "rgba(255, 255, 255, 0.6)"} 
                                    />
                                </TouchableOpacity>
                            </View>
                            {confirmarSenha && senha !== confirmarSenha && (
                                <Text style={estilos.textoErro}>As senhas não coincidem</Text>
                            )}
                        </View>
        
                        <Animated.View
                            style={{
                                opacity: animacaoBotao,
                                transform: [{ scale: animacaoBotao }]
                            }}
                        >
                            <TouchableOpacity 
                                onPress={lidarComRegistro} 
                                style={[
                                    estilos.botaoRegistro,
                                    carregando && estilos.botaoDesabilitado
                                ]}
                                disabled={carregando || !conectado}
                                activeOpacity={0.9}
                            >
                                <View style={estilos.gradienteBotao}>
                                    {carregando ? (
                                        <View style={estilos.botaoComCarregamento}>
                                            <ActivityIndicator color="#FFFFFF" size="small" />
                                            <Text style={estilos.textoBotaoRegistro}>Criando conta...</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <Text style={estilos.textoBotaoRegistro}>Criar Conta</Text>
                                            <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                                        </>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </Animated.View>
        
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
                            onPress={() => navigation.goBack()}
                            style={estilos.linkNavegacao}
                            disabled={carregando}
                        >
                            <Text style={estilos.textoLinkNavegacao}>Já tem conta? Fazer login</Text>
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
  
    containerFundo: {
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
    
    grupoEntrada: {
      gap: spacing.sm,
    },
    
    rotuloEntrada: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      color: '#FFFFFF',
      marginLeft: spacing.sm,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
  
    involucroEntrada: {
      position: 'relative',
    },
    
    entrada: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: borders.radius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingRight: spacing.xl + 20,
      borderWidth: borders.width.thin,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      fontSize: typography.fontSize.base,
      color: '#FFFFFF',
      ...shadows.base,
    },
  
    iconeEntrada: {
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
    
    entradaFocada: {
      borderColor: '#00C9FF',
      borderWidth: borders.width.base,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      ...shadows.lg,
    },
    
    entradaErro: {
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
    
    botaoRegistro: {
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
    
    textoBotaoRegistro: {
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