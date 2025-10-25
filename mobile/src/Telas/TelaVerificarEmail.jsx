import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { buscarApi, obterDetalhesErro } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';
import { typography, spacing, borders, shadows } from '../styles/globalStyles';

const { height } = Dimensions.get('window');
const TEMPO_REENVIO_SEGUNDOS = 60;

export default function TelaVerificarEmail({ navigation, route }) {
    const emailDoUsuario = route.params?.email || '';
    
    // Pegando a função 'entrar' do contexto de autenticação
    const { entrar } = usarAutenticacao(); 

    const [codigo, setCodigo] = useState('');
    const [codigoFocado, setCodigoFocado] = useState(false);
    const [carregando, setCarregando] = useState(false);
    
    // Lógica do Timer
    const [tempoRestante, setTempoRestante] = useState(0);
    const timerRef = useRef(null);
    const podeReenviar = tempoRestante === 0;

    // --- Efeitos e Animações (Sem Alterações) ---
    const animacaoFade = useRef(new Animated.Value(0)).current;
    const animacaoDeslizar = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        iniciarTimer();
        
        Animated.parallel([
            Animated.timing(animacaoFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(animacaoDeslizar, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();

        return () => {
            clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (tempoRestante > 0) {
            timerRef.current = setInterval(() => {
                setTempoRestante(prev => prev - 1);
            }, 1000);
        } else if (tempoRestante === 0) {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [tempoRestante]);

    const iniciarTimer = () => {
        setTempoRestante(TEMPO_REENVIO_SEGUNDOS);
    };

    // --- Lógica do Formulário ---
    const validarCodigo = (cod) => /^\d{6}$/.test(cod);

    async function lidarComVerificacao() {
        if (!validarCodigo(codigo)) {
            return Alert.alert('Código Inválido', 'O código deve conter exatamente 6 dígitos.');
        }

        setCarregando(true);

        try {
            // 1. Chamar a rota de verificação (espera o token e usuário do backend)
            const resposta = await buscarApi('/api/autenticacao/verificar-codigo', {
                method: 'POST',
                body: { 
                    email: emailDoUsuario, 
                    codigo: codigo 
                }
            });
            
            // 2. Logar o usuário na sessão (AuthContext)
            await entrar(resposta.token, resposta.usuario); 

            // 3. Informar sucesso e redirecionar para o Quiz
            Alert.alert('Sucesso!', 'Email verificado e login efetuado! Vamos configurar seu perfil.', [
                 { 
                    text: 'Continuar', 
                    onPress: () => navigation.replace('Quiiz') // Redirecionamento para a tela Quiiz
                 }
            ]);

        } catch (erro) {
            const msg = obterDetalhesErro(erro) || 'Erro ao verificar o código.';

            if (erro.status === 400 && msg.includes('expirou')) {
                Alert.alert('Código Expirado', 'O código de verificação expirou. Por favor, solicite um novo.');
            } else {
                 Alert.alert('Erro na Verificação', msg);
            }
        } finally {
            setCarregando(false);
        }
    }

    async function lidarComReenvio() {
        if (!podeReenviar || carregando) return;

        setCarregando(true);

        try {
            await buscarApi('/api/autenticacao/enviar-codigo', {
                method: 'POST',
                body: { email: emailDoUsuario }
            });

            Alert.alert('Enviado!', 'Um novo código foi enviado para o seu email.');
            iniciarTimer();

        } catch (erro) {
             Alert.alert('Erro ao Reenviar', obterDetalhesErro(erro) || 'Falha ao solicitar novo código.');
        } finally {
            setCarregando(false);
        }
    }

    return (
        <View style={estilos.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

            <KeyboardAvoidingView 
                style={estilos.containerTeclado} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView 
                    contentContainerStyle={estilos.conteudoRolagem}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View 
                        style={[
                            estilos.cabecalho,
                            { opacity: animacaoFade, transform: [{ translateY: animacaoDeslizar }] }
                        ]}
                    >
                        <MaterialIcons name="security" size={60} color="#00C9FF" style={{ marginBottom: spacing.lg }} />
                        <Text style={estilos.textoTitulo}>Verificação de E-mail</Text>
                        <Text style={estilos.textoSubtitulo}>
                            Digite o código de 6 dígitos que enviamos para:
                            <Text style={{ fontWeight: typography.fontWeight.bold }}> {emailDoUsuario}</Text>
                        </Text>
                    </Animated.View>

                    <Animated.View 
                        style={[
                            estilos.containerFormulario,
                            { opacity: animacaoFade, transform: [{ translateY: animacaoDeslizar }] }
                        ]}
                    >
                        {/* Input do Código */}
                        <View style={estilos.grupoEntrada}>
                            <Text style={estilos.rotuloEntrada}>Código de Verificação (6 dígitos)</Text>
                            <View style={estilos.involucroEntrada}>
                                <TextInput
                                    style={[
                                        estilos.entrada,
                                        codigoFocado && estilos.entradaFocada,
                                        codigo.length > 0 && !validarCodigo(codigo) && estilos.entradaErro
                                    ]}
                                    placeholder="••••••"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={codigo}
                                    onChangeText={setCodigo}
                                    onFocus={() => setCodigoFocado(true)}
                                    onBlur={() => setCodigoFocado(false)}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!carregando}
                                />
                            </View>
                            {codigo.length > 0 && !validarCodigo(codigo) && (
                                <Text style={estilos.textoErro}>O código deve ter 6 dígitos numéricos.</Text>
                            )}
                        </View>
                        
                        {/* Botão de Verificação */}
                        <TouchableOpacity 
                            onPress={lidarComVerificacao} 
                            style={[
                                estilos.botaoPrimario,
                                (!validarCodigo(codigo) || carregando) && estilos.botaoDesabilitado
                            ]}
                            disabled={!validarCodigo(codigo) || carregando}
                        >
                            {carregando ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={estilos.textoBotaoPrimario}>Verificar Email</Text>
                            )}
                        </TouchableOpacity>

                        {/* Botão de Reenvio */}
                        <TouchableOpacity 
                            onPress={lidarComReenvio}
                            style={[
                                estilos.botaoSecundario,
                                !podeReenviar && estilos.botaoDesabilitado
                            ]}
                            disabled={!podeReenviar || carregando}
                        >
                            <Text style={[estilos.textoBotaoSecundario, !podeReenviar && { color: 'rgba(255, 255, 255, 0.4)' }]}>
                                {podeReenviar 
                                    ? 'Reenviar Código' 
                                    : `Reenviar em ${tempoRestante}s`}
                            </Text>
                        </TouchableOpacity>

                        {/* Navegação de Volta */}
                        <View style={estilos.containerNavegacao}>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={carregando}>
                                <Text style={estilos.textoLinkNavegacao}>Voltar ao Login</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const estilos = StyleSheet.create({
    // Estilos de container e fundo (iguais à TelaRegistro)
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    containerTeclado: {
        flex: 1,
    },
    conteudoRolagem: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: height * 0.1, // Ajuste para centralizar
    },
    
    // Novos Estilos/Ajustados
    cabecalho: {
        alignItems: 'center',
        paddingBottom: spacing['2xl'],
    },
    textoTitulo: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: '#FFFFFF',
        marginBottom: spacing.sm,
    },
    textoSubtitulo: {
        fontSize: typography.fontSize.base,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: spacing.md,
        maxWidth: 300,
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
    },
    involucroEntrada: {
        position: 'relative',
    },
    entrada: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: borders.radius.xl,
        paddingVertical: spacing.lg, // Mais padding para código
        paddingHorizontal: spacing.lg,
        borderWidth: borders.width.thin,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        fontSize: typography.fontSize.xl, // Fonte maior para código
        textAlign: 'center',
        color: '#FFFFFF',
    },
    entradaFocada: {
        borderColor: '#00C9FF',
        borderWidth: borders.width.base,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
    },

    // Botões
    botaoPrimario: {
        borderRadius: borders.radius.full,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        backgroundColor: '#00C9FF',
        marginTop: spacing.md,
    },
    textoBotaoPrimario: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    botaoSecundario: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    textoBotaoSecundario: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.medium,
        color: 'rgba(0, 201, 255, 0.8)',
    },
    botaoDesabilitado: {
        opacity: 0.5,
    },
    
    // Navegação
    containerNavegacao: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    textoLinkNavegacao: {
        fontSize: typography.fontSize.base,
        color: 'rgba(255, 255, 255, 0.6)',
        textDecorationLine: 'underline',
    }
});