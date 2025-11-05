import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Switch, Alert, Dimensions, Animated } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

import { usarAutenticacao } from '../services/AuthContext';
import { colors, typography, spacing, borders, shadows } from '../styles/globalStyles';
import * as Notifications from 'expo-notifications'; // Importar Notifications
import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistência
import { agendarNotificacaoDiaria, cancelarNotificacoes } from '../services/notificacoes';

const { width, height } = Dimensions.get('window');



export default function TelaConfiguracoes({ navigation }) {
  const { usuario, fazerLogout } = usarAutenticacao();
  
  // Estados para as configurações
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);
  const [somAtivo, setSomAtivo] = useState(true);
  const [vibracaoAtiva, setVibracaoAtiva] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);
  const [modoEconomia, setModoEconomia] = useState(false);
  const [sincronizacaoAutomatica, setSincronizacaoAutomatica] = useState(true);

  const lidarComEditarPerfil = () => {
    navigation.navigate('EditarPerfil');
  };

  const lidarComAlterarSenha = () => {
    navigation.navigate('AlterarSenha');
  };

  const lidarComPrivacidade = () => {
    Alert.alert('Privacidade', 'Funcionalidade em desenvolvimento');
  };

  const lidarComTermos = () => {
    navigation.navigate('TermosDeUso'); 
  };

  const lidarComPoliticaPrivacidade = () => {
    navigation.navigate('PoliticaPrivacidade');
  };

  const lidarComSobre = () => {
    navigation.navigate('SobreApp');
  };

  const lidarComAjuda = () => {
    navigation.navigate('Ajuda');
  };

  const lidarComFeedback = () => {
    navigation.navigate('FeedBack');
  };

  

  const lidarComLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            try {
              await fazerLogout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (erro) {
              console.error('Erro ao fazer logout:', erro);
            }
          }
        }
      ]
    );
  };



  const renderizarItemConfiguracao = ({ 
    titulo, 
    subtitulo, 
    icone, 
    acao, 
    tipo = 'botao',
    valor = null,
    onValueChange = null,
    perigoso = false,
    destaque = false
  }) => (
    <TouchableOpacity 
      style={[
        estilos.itemConfiguracao,
        perigoso && estilos.itemPerigoso,
        destaque && estilos.itemDestaque
      ]} 
      onPress={acao}
      disabled={tipo === 'switch'}
      activeOpacity={0.7}
    >
      <View style={estilos.informacoesItem}>
        <View style={[
          estilos.iconeItem,
          destaque && estilos.iconeItemDestaque
        ]}>
          <MaterialIcons 
            name={icone} 
            size={24} 
            color={perigoso ? colors.error : destaque ? colors.primary[600] : colors.neutral[400]} 
          />
        </View>
        <View style={estilos.textosItem}>
          <Text style={[
            estilos.tituloItem,
            perigoso && estilos.tituloItemPerigoso,
            destaque && estilos.tituloItemDestaque
          ]}>
            {titulo}
          </Text>
          {subtitulo && (
            <Text style={[
              estilos.subtituloItem,
              destaque && estilos.subtituloItemDestaque
            ]}>
              {subtitulo}
            </Text>
          )}
        </View>
      </View>
      
      {tipo === 'switch' && onValueChange && (
        <Switch
          value={valor}
          onValueChange={onValueChange}
          trackColor={{ false: colors.neutral[600], true: colors.primary[400] }}
          thumbColor={valor ? colors.primary[600] : colors.neutral[400]}
          ios_backgroundColor={colors.neutral[600]}
        />
      )}
      
      {tipo === 'botao' && (
        <View style={estilos.indicadorSeta}>
          <MaterialIcons 
            name="chevron-right" 
            size={24} 
            color={perigoso ? colors.error : colors.neutral[400]} 
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={estilos.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.neutral[900]} />
      
      {/* Header moderno */}
      <View style={estilos.header}>
        <View style={estilos.headerContent}>
          <TouchableOpacity 
            style={estilos.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={estilos.headerText}>
            <Text style={estilos.headerTitle}>Configurações</Text>
          </View>
          
          <View style={estilos.espacoDireita} />
        </View>
      </View>

      <ScrollView 
        style={estilos.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={estilos.conteudoScroll}
      >
        {/* Card de perfil */}
        <View style={estilos.cardPerfil}>
          <View style={estilos.avatarPerfil}>
            <Text style={estilos.textoAvatar}>
              {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          
          <View style={estilos.informacoesPerfil}>
            <Text style={estilos.nomeUsuario}>
              {usuario?.nome || 'Usuário'}
            </Text>
            <Text style={estilos.emailUsuario}>
              {usuario?.email || 'usuario@email.com'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={estilos.botaoEditarPerfil}
            onPress={lidarComEditarPerfil}
            activeOpacity={0.8}
          >
            <MaterialIcons name="edit" size={20} color={colors.primary[600]} />
          </TouchableOpacity>
        </View>

        {/* Configurações de Conta */}
        <View style={estilos.treinosSection}>
          <Text style={estilos.sectionTitle}>Conta</Text>
          {renderizarItemConfiguracao({
            titulo: 'Editar Perfil',
            icone: 'person',
            acao: lidarComEditarPerfil,
            destaque: true
          })}
          {renderizarItemConfiguracao({
            titulo: 'Alterar Senha',
            icone: 'lock',
            acao: lidarComAlterarSenha,
            destaque: true
          })}
        </View>

        {/* Configurações do App */}
        <View style={estilos.treinosSection}>
          <Text style={estilos.sectionTitle}>Preferências</Text>
          {renderizarItemConfiguracao({
            titulo: 'Notificações',
            icone: 'notifications',
            tipo: 'switch',
            valor: notificacoesAtivas,
            onValueChange: setNotificacoesAtivas
          })}
          {renderizarItemConfiguracao({
            titulo: 'Som',
            icone: 'volume-up',
            tipo: 'switch',
            valor: somAtivo,
            onValueChange: setSomAtivo
          })}
          {renderizarItemConfiguracao({
            titulo: 'Vibração',
            icone: 'smartphone',
            tipo: 'switch',
            valor: vibracaoAtiva,
            onValueChange: setVibracaoAtiva
          })}
          {renderizarItemConfiguracao({
            titulo: 'Modo Escuro',
            icone: 'brightness-2',
            tipo: 'switch',
            valor: modoEscuro,
            onValueChange: setModoEscuro
          })}
          {renderizarItemConfiguracao({
            titulo: 'Sincronização Automática',
            icone: 'cloud-upload',
            tipo: 'switch',
            valor: sincronizacaoAutomatica,
            onValueChange: setSincronizacaoAutomatica
          })}
        </View>

        {/* Suporte e Ajuda */}
        <View style={estilos.treinosSection}>
          <Text style={estilos.sectionTitle}>Suporte</Text>
          {renderizarItemConfiguracao({
            titulo: 'Ajuda',
            icone: 'help-outline',
            acao: lidarComAjuda
          })}
          {renderizarItemConfiguracao({
            titulo: 'Fazer Quiz',
            icone: 'quiz',
            acao: () => navigation.navigate('Quiiz'),
            destaque: true
          })}
          {renderizarItemConfiguracao({
            titulo: 'Enviar Feedback',
            icone: 'feedback',
            acao: lidarComFeedback
          })}
          {renderizarItemConfiguracao({
            titulo: 'Sobre o App',
            icone: 'info',
            acao: lidarComSobre
          })}
        </View>

        {/* Legal */}
        <View style={estilos.treinosSection}>
          <Text style={estilos.sectionTitle}>Legal</Text>
          {renderizarItemConfiguracao({
            titulo: 'Termos de Uso',
            icone: 'description',
            acao: lidarComTermos
          })}
          {renderizarItemConfiguracao({
            titulo: 'Política de Privacidade',
            icone: 'security',
            acao: lidarComPoliticaPrivacidade
          })}
        </View>

        {/* Sair da conta */}
        <View style={estilos.treinosSection}>
          <Text style={estilos.sectionTitle}>Conta</Text>
          {renderizarItemConfiguracao({
            titulo: 'Sair da Conta',
            icone: 'logout',
            acao: lidarComLogout,
            perigoso: true
          })}
        </View>

        {/* Versão do app com estilo melhorado */}
        <View style={estilos.versaoContainer}>
          <View style={estilos.versaoCard}>
            <Text style={estilos.textoVersao}>NutriSnap v1.0.0</Text>
            <Text style={estilos.textoCopyright}>
              © 2024 NutriSnap Team. Todos os direitos reservados.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  
  header: {
    backgroundColor: colors.neutral[800],
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borders.radius['2xl'],
    borderBottomRightRadius: borders.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.neutral[700],
    ...shadows.xl,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[600],
  },
  
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.neutral[50],
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },

  espacoDireita: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  conteudoScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  cardPerfil: {
    backgroundColor: colors.neutral[800],
    borderRadius: borders.radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    ...shadows.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarPerfil: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[600] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary[600] + '40',
  },

  textoAvatar: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[600],
  },

  informacoesPerfil: {
    flex: 1,
  },

  nomeUsuario: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
    marginBottom: spacing.xs,
  },

  emailUsuario: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral[400],
  },

  botaoEditarPerfil: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[600],
  },

  treinosSection: {
    marginBottom: spacing.xl,
  },
  
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
    marginBottom: spacing.lg,
    textAlign: 'center',
  },

  itemConfiguracao: {
    backgroundColor: colors.neutral[800],
    borderRadius: borders.radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[700],
    ...shadows.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  itemPerigoso: {
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '05',
  },

  itemDestaque: {
    borderColor: colors.primary[600] + '30',
    backgroundColor: colors.primary[900] + '10',
  },

  informacoesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconeItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.neutral[700] + '20',
  },

  iconeItemDestaque: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[600] + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  textosItem: {
    flex: 1,
  },

  tituloItem: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
    marginBottom: spacing.xs,
  },

  tituloItemPerigoso: {
    color: colors.error,
  },

  tituloItemDestaque: {
    color: colors.primary[100],
    fontSize: typography.fontSize.lg,
  },

  subtituloItem: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[400],
    lineHeight: typography.lineHeight.normal,
  },

  subtituloItemDestaque: {
    color: colors.primary[200],
    fontSize: typography.fontSize.base,
  },

  indicadorSeta: {
    padding: spacing.xs,
  },

  versaoContainer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },

  versaoCard: {
    backgroundColor: colors.neutral[800],
    borderRadius: borders.radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[700],
    ...shadows.lg,
  },

  textoVersao: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[300],
    marginBottom: spacing.xs,
  },

  textoCopyright: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
  },
});
