import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, Alert, Linking,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borders, shadows } from '../styles/globalStyles';
import { usarAutenticacao } from '../services/AuthContext';

export default function TelaFeedback({ navigation }) {
  const { usuario } = usarAutenticacao();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');

  const emailDesenvolvedores = 'kaioalexandre2681@gmail.com';
  const emailSujeitoPadrao = 'Feedback sobre o aplicativo NutriSnap';

  const lidarComEnvio = async () => {
    if (!mensagem.trim()) {
      Alert.alert('Erro', 'Por favor, escreva sua mensagem antes de enviar.');
      return;
    }

    const destinatario = emailDesenvolvedores;
    const assuntoEmail = assunto.trim() || emailSujeitoPadrao;
    const corpoEmail = `Olá, Kaio! Sou o usuário ${usuario?.nome || 'Anônimo'} (${usuario?.email || 'N/A'})\n\nMinha mensagem:\n\n${mensagem}`;

    const url = `mailto:${destinatario}?subject=${encodeURIComponent(assuntoEmail)}&body=${encodeURIComponent(corpoEmail)}`;

    try {
      const suporta = await Linking.canOpenURL(url);

      if (suporta) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o aplicativo de e-mail. Por favor, configure um cliente de e-mail em seu dispositivo.');
      }
    } catch (erro) {
      console.error('Erro ao abrir o e-mail:', erro);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar enviar o feedback.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cabecalho}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
            <MaterialIcons name="arrow-back" size={24} color={colors.neutral[50]} />
          </TouchableOpacity>
          <Text style={styles.titulo}>Enviar Feedback</Text>
        </View>

        <Text style={styles.subtitulo}>
          Sua opinião é muito importante para nós! Use o formulário abaixo para enviar sugestões, relatar bugs ou fazer elogios.
        </Text>

        <View style={styles.formulario}>
          <Text style={styles.label}>Assunto</Text>
          <TextInput
            style={styles.input}
            value={assunto}
            onChangeText={setAssunto}
            placeholder={emailSujeitoPadrao}
            placeholderTextColor={colors.neutral[500]}
          />

          <Text style={styles.label}>Sua Mensagem</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={mensagem}
            onChangeText={setMensagem}
            placeholder="Escreva sua mensagem aqui..."
            placeholderTextColor={colors.neutral[500]}
          />

          <TouchableOpacity
            style={styles.botao}
            onPress={lidarComEnvio}
          >
            <Text style={styles.textoBotao}>Abrir E-mail para Enviar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[900],
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing['2xl'],
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  botaoVoltar: {
    marginRight: spacing.md,
  },
  titulo: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[100],
  },
  subtitulo: {
    fontSize: typography.fontSize.base,
    color: colors.neutral[400],
    marginBottom: spacing.xl,
  },
  formulario: {
    width: '100%',
  },
  label: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral[300],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.neutral[800],
    color: colors.neutral[50],
    borderRadius: borders.radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  botao: {
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: borders.radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.md,
  },
  textoBotao: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
  },
});