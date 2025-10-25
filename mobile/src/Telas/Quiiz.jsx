import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borders, shadows } from '../styles/globalStyles';
import { buscarApi } from '../services/api';
import { usarAutenticacao } from '../services/AuthContext';

const { width, height } = Dimensions.get('window');

export default function Quiz({ navigation, route }) {
    const { token } = usarAutenticacao();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [carregando, setCarregando] = useState(false);

    // Verificar se veio do cadastro (mantido para a função prevStep)
    const isFromRegistration = route?.params?.fromRegistration || false;

    const questions = [
        // ... (Seu array de perguntas permanece o mesmo)
        {
            id: 'dados_pessoais',
            title: 'Informações básicas',
            type: 'form',
            fields: [
                { id: 'idade', label: 'Idade', type: 'numeric', placeholder: 'Digite sua idade', required: true },
                { id: 'sexo', label: 'Sexo', type: 'single', placeholder: 'Selecione seu sexo', required: true, options: [
                    { id: 'masculino', text: 'Masculino' },
                    { id: 'feminino', text: 'Feminino' },
                    { id: 'outro', text: 'Outro' }
                ]}
            ]
        },
        {
            id: 'medidas_corporais',
            title: 'Medidas corporais',
            type: 'form',
            fields: [
                { id: 'altura', label: 'Altura (cm)', type: 'numeric', placeholder: 'Digite sua altura', required: true },
                { id: 'peso_atual', label: 'Peso atual (kg)', type: 'numeric', placeholder: 'Digite seu peso atual', required: true },
                { id: 'peso_meta', label: 'Peso desejado (kg)', type: 'numeric', placeholder: 'Digite seu peso meta', required: true }
            ]
        },
        {
            id: 'objetivo',
            title: 'Qual é seu objetivo principal?',
            type: 'single',
            options: [
                { id: 'emagrecer', text: 'Emagrecer' },
                { id: 'ganhar_massa', text: 'Ganhar massa muscular' },
                { id: 'manter_peso', text: 'Manter o peso atual' },
                { id: 'saude', text: 'Melhorar a saúde geral' },
                { id: 'forca', text: 'Aumentar força física' },
                { id: 'resistencia', text: 'Melhorar resistência cardiovascular' },
                { id: 'flexibilidade', text: 'Aumentar flexibilidade' },
                { id: 'reabilitacao', text: 'Reabilitação/Recuperação de lesão' }
            ]
        },
        {
            id: 'nivel_atividade',
            title: 'Como você descreveria seu nível de atividade física?',
            type: 'single',
            options: [
                { id: 'sedentario', text: 'Sedentário - pouco ou nenhum exercício' },
                { id: 'leve', text: 'Levemente ativo - exercício leve 1-3x por semana' },
                { id: 'moderado', text: 'Moderadamente ativo - exercício 3-5x por semana' },
                { id: 'ativo', text: 'Muito ativo - exercício intenso 6-7x por semana' },
                { id: 'atleta', text: 'Atleta - treino intenso diário + competições' }
            ]
        },
        {
            id: 'frequencia_treino',
            title: 'Com que frequência você pretende treinar?',
            type: 'single',
            options: [
                { id: '2_3_vezes', text: '2-3 vezes por semana' },
                { id: '3_4_vezes', text: '3-4 vezes por semana' },
                { id: '4_5_vezes', text: '4-5 vezes por semana' },
                { id: '5_6_vezes', text: '5-6 vezes por semana' },
                { id: 'diario', text: 'Todos os dias' },
                { id: 'flexivel', text: 'Flexível, conforme disponibilidade' }
            ]
        },
        {
            id: 'acesso_academia',
            title: 'Qual é seu acesso a equipamentos de treino?',
            type: 'single',
            options: [
                { id: 'academia_completa', text: 'Academia completa com todos os equipamentos' },
                { id: 'academia_basica', text: 'Academia básica com equipamentos limitados' },
                { id: 'casa_equipamentos', text: 'Casa com alguns equipamentos (pesos, esteira)' },
                { id: 'casa_sem_equipamentos', text: 'Casa sem equipamentos específicos' },
                { id: 'ar_livre', text: 'Treino ao ar livre/parques' },
                { id: 'sem_acesso', text: 'Sem acesso a equipamentos' }
            ]
        },
        {
            id: 'dieta_atual',
            title: 'Como você descreveria sua dieta atual?',
            type: 'single',
            options: [
                { id: 'nao_controlo', text: 'Não controlo muito o que como' },
                { id: 'tento_controlar', text: 'Tento controlar, mas é difícil' },
                { id: 'controlo_parcial', text: 'Controlo parcialmente' },
                { id: 'controlo_total', text: 'Tenho controle total sobre minha alimentação' }
            ]
        },
        {
            id: 'preferencias',
            title: 'Quais são suas preferências alimentares?',
            type: 'multiple',
            options: [
                { id: 'vegetariano', text: 'Vegetariano' },
                { id: 'vegano', text: 'Vegano' },
                { id: 'sem_gluten', text: 'Sem glúten' },
                { id: 'sem_lactose', text: 'Sem lactose' },
                { id: 'sem_restricoes', text: 'Sem restrições' },
                { id: 'low_carb', text: 'Low carb' },
                { id: 'keto', text: 'Cetogênica' },
                { id: 'paleo', text: 'Paleo' },
                { id: 'mediterranea', text: 'Mediterrânea' },
                { id: 'intermitente', text: 'Jejum intermitente' }
            ]
        },
        {
            id: 'habitos_alimentares',
            title: 'Como são seus hábitos alimentares?',
            type: 'multiple',
            options: [
                { id: 'cafe_da_manha', text: 'Sempre tomo café da manhã' },
                { id: 'lanches', text: 'Faço lanches entre as refeições' },
                { id: 'jantar_tarde', text: 'Janto cedo (antes das 20h)' },
                { id: 'agua', text: 'Bebo muita água durante o dia' },
                { id: 'refeicoes_regulares', text: 'Tenho horários fixos para refeições' },
                { id: 'comida_caseira', text: 'Prefiro comida caseira' },
                { id: 'fast_food', text: 'Consumo fast food frequentemente' },
                { id: 'suplementos', text: 'Uso suplementos alimentares' }
            ]
        },
        {
            id: 'restricoes_medicas',
            title: 'Você tem alguma restrição médica ou condição de saúde?',
            type: 'multiple',
            options: [
                { id: 'diabetes', text: 'Diabetes' },
                { id: 'hipertensao', text: 'Hipertensão' },
                { id: 'colesterol_alto', text: 'Colesterol alto' },
                { id: 'problemas_cardiacos', text: 'Problemas cardíacos' },
                { id: 'problemas_renais', text: 'Problemas renais' },
                { id: 'problemas_articulares', text: 'Problemas articulares' },
                { id: 'lesoes_anteriores', text: 'Lesões anteriores' },
                { id: 'nenhuma', text: 'Nenhuma restrição' }
            ]
        },
        {
            id: 'historico_exercicios',
            title: 'Qual é seu histórico com exercícios físicos?',
            type: 'single',
            options: [
                { id: 'iniciante', text: 'Iniciante - nunca pratiquei exercícios regularmente' },
                { id: 'intermediario', text: 'Intermediário - já pratiquei, mas parei' },
                { id: 'avancado', text: 'Avançado - pratico há mais de 1 ano' },
                { id: 'ex_atleta', text: 'Ex-atleta - já pratiquei esportes competitivos' },
                { id: 'personal_trainer', text: 'Já trabalhei com personal trainer' }
            ]
        },
        {
            id: 'tipo_treino_preferido',
            title: 'Que tipo de treino você prefere?',
            type: 'multiple',
            options: [
                { id: 'musculacao', text: 'Musculação' },
                { id: 'cardio', text: 'Cardiovascular (corrida, bike, natação)' },
                { id: 'funcional', text: 'Treino funcional' },
                { id: 'yoga', text: 'Yoga/Pilates' },
                { id: 'esportes', text: 'Esportes (futebol, basquete, tênis)' },
                { id: 'crossfit', text: 'CrossFit' },
                { id: 'calistenia', text: 'Calistenia (exercícios com peso corporal)' },
                { id: 'danca', text: 'Dança/Zumba' }
            ]
        },
        {
            id: 'horario_preferido',
            title: 'Em que horário você prefere treinar?',
            type: 'single',
            options: [
                { id: 'manha_cedo', text: 'Manhã cedo (6h-8h)' },
                { id: 'manha_tardia', text: 'Manhã (9h-12h)' },
                { id: 'tarde', text: 'Tarde (13h-17h)' },
                { id: 'noite', text: 'Noite (18h-21h)' },
                { id: 'madrugada', text: 'Madrugada (22h-5h)' },
                { id: 'flexivel_horario', text: 'Horário flexível' }
            ]
        },
        {
            id: 'duracao_treino',
            title: 'Qual duração ideal para seus treinos?',
            type: 'single',
            options: [
                { id: '30_min', text: '30 minutos ou menos' },
                { id: '45_min', text: '45 minutos' },
                { id: '60_min', text: '1 hora' },
                { id: '90_min', text: '1 hora e 30 minutos' },
                { id: '120_min', text: '2 horas ou mais' },
                { id: 'flexivel_duracao', text: 'Duração flexível' }
            ]
        },
        {
            id: 'metas_especificas',
            title: 'Quais são suas metas específicas?',
            type: 'multiple',
            options: [
                { id: 'perder_5kg', text: 'Perder 5kg em 3 meses' },
                { id: 'perder_10kg', text: 'Perder 10kg em 6 meses' },
                { id: 'ganhar_5kg', text: 'Ganhar 5kg de massa muscular' },
                { id: 'correr_5km', text: 'Correr 5km sem parar' },
                { id: 'correr_10km', text: 'Correr 10km sem parar' },
                { id: 'flexibilidade', text: 'Tocar os pés com as mãos' },
                { id: 'forca', text: 'Fazer 20 flexões seguidas' },
                { id: 'resistencia', text: 'Melhorar resistência geral' }
            ]
        },
        {
            id: 'motivacao',
            title: 'O que mais te motiva a se exercitar?',
            type: 'single',
            options: [
                { id: 'saude', text: 'Melhorar a saúde' },
                { id: 'aparencia', text: 'Melhorar a aparência física' },
                { id: 'energia', text: 'Ter mais energia no dia a dia' },
                { id: 'estresse', text: 'Reduzir estresse e ansiedade' },
                { id: 'social', text: 'Interação social' },
                { id: 'desafio', text: 'Desafios pessoais' },
                { id: 'competicao', text: 'Competição' },
                { id: 'outros', text: 'Outros motivos' }
            ]
        },
        {
            id: 'obstaculos',
            title: 'Quais são os principais obstáculos para você se exercitar?',
            type: 'multiple',
            options: [
                { id: 'falta_tempo', text: 'Falta de tempo' },
                { id: 'falta_dinheiro', text: 'Falta de dinheiro' },
                { id: 'falta_motivacao', text: 'Falta de motivação' },
                { id: 'falta_conhecimento', text: 'Falta de conhecimento técnico' },
                { id: 'medo_lesao', text: 'Medo de se lesionar' },
                { id: 'falta_equipamentos', text: 'Falta de equipamentos' },
                { id: 'falta_acompanhamento', text: 'Falta de acompanhamento profissional' },
                { id: 'nenhum', text: 'Nenhum obstáculo' }
            ]
        }
    ];

    const currentQuestion = questions[step];

    const handleAnswer = (questionId, answerId, value) => {
        if (currentQuestion.type === 'multiple') {
            setAnswers(prev => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    [answerId]: !prev[questionId]?.[answerId]
                }
            }));
        } else if (currentQuestion.type === 'single') {
            setAnswers(prev => ({
                ...prev,
                [questionId]: answerId
            }));
        } else if (currentQuestion.type === 'form') {
            // Para campos de formulário, o processamento da vírgula é feito no onChangeText
            setAnswers(prev => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    [answerId]: value
                }
            }));
        }
    };

    const canProceed = () => {
        if (currentQuestion.type === 'single') {
            return answers[currentQuestion.id];
        } else if (currentQuestion.type === 'multiple') {
            const questionAnswers = answers[currentQuestion.id];
            return questionAnswers && Object.values(questionAnswers).some(v => v);
        } else if (currentQuestion.type === 'form') {
            const questionAnswers = answers[currentQuestion.id];
            if (!questionAnswers) return false;
            
            // Verificar campos obrigatórios
            return currentQuestion.fields.every(field => {
                if (field.required) {
                    if (field.type === 'single') {
                        return questionAnswers[field.id];
                    } else {
                        return questionAnswers[field.id] && questionAnswers[field.id].toString().trim().length > 0;
                    }
                }
                return true;
            });
        }
        return false;
    };

    const salvarDadosUsuario = async () => {
        try {
            setCarregando(true);

            // Debug: verificar token antes de salvar
            console.log('🔍 Salvando dados - Token disponível:', { 
                temToken: !!token, 
                tokenLength: token?.length || 0,
                tokenInicio: token ? token.substring(0, 20) + '...' : 'N/A'
            });

            if (!token) {
                throw new Error('Token de autenticação não disponível');
            }

            // Extrair dados do quiz
            const dadosUsuario = {
                idade: parseInt(answers.dados_pessoais?.idade) || 0,
                sexo: answers.dados_pessoais?.sexo || '',
                altura: parseFloat(answers.medidas_corporais?.altura) || 0,
                peso_atual: parseFloat(answers.medidas_corporais?.peso_atual) || 0,
                peso_meta: parseFloat(answers.medidas_corporais?.peso_meta) || 0,
                objetivo: answers.objetivo || '',
                nivel_atividade: answers.nivel_atividade || '',
                frequencia_treino: answers.frequencia_treino || '',
                acesso_academia: answers.acesso_academia || '',
                dieta_atual: answers.dieta_atual || '',
                preferencias: answers.preferencias || {},
                habitos_alimentares: answers.habitos_alimentares || {},
                restricoes_medicas: answers.restricoes_medicas || {},
                historico_exercicios: answers.historico_exercicios || '',
                tipo_treino_preferido: answers.tipo_treino_preferido || {},
                horario_preferido: answers.horario_preferido || '',
                duracao_treino: answers.duracao_treino || '',
                metas_especificas: answers.metas_especificas || {},
                motivacao: answers.motivacao || '',
                obstaculos: answers.obstaculos || {}
            };

            console.log('🔍 Dados do usuário preparados:', dadosUsuario);

            // Calcular dias para meta (estimativa simples)
            const dias = Math.abs(Math.round((dadosUsuario.peso_meta - dadosUsuario.peso_atual) * 7)); // 1kg por semana
            // Calcular calorias diárias baseado no objetivo
            const calorias_diarias = calcularCaloriasDiarias();

            // Salvar respostas do quiz
            console.log('🔍 Salvando quiz...');
            await buscarApi('/api/quiz', {
                method: 'POST',
                token,
                body: dadosUsuario
            });

            // Salvar metas
            console.log('🔍 Salvando metas...');
            await buscarApi('/api/metas', {
                method: 'POST',
                token,
                body: {
                    peso_atual: dadosUsuario.peso_atual,
                    peso_meta: dadosUsuario.peso_meta,
                    dias: dias,
                    calorias_diarias: calorias_diarias
                }
            });

            // Salvar plano de treino básico
            console.log('🔍 Salvando plano de treino...');
            const planoTreino = gerarPlanoTreino(dadosUsuario);
            await buscarApi('/api/treinos', {
                method: 'POST',
                token,
                body: {
                    plano: planoTreino
                }
            });

            console.log('✅ Dados do usuário salvos com sucesso');
            
            // Mostrar mensagem de sucesso
            Alert.alert(
                'Perfil Completo!',
                'Seu perfil foi configurado com sucesso! Agora você pode começar a usar o NutriSnap.',
                [
                    {
                        text: 'Começar',
                        onPress: () => {
                            // CORREÇÃO DE NAVEGAÇÃO AQUI
                            // Sempre vai para o painel principal
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Principal' }],
                            });
                        }
                    }
                ]
            );

        } catch (erro) {
            console.error('❌ Erro ao salvar dados:', erro);
            Alert.alert(
                'Erro',
                'Não foi possível salvar suas informações. Tente novamente.',
                [{ text: 'OK' }]
            );
        } finally {
            setCarregando(false);
        }
    };

    const calcularCaloriasDiarias = () => {
        const idade = parseInt(answers.dados_pessoais?.idade) || 25;
        const sexo = answers.dados_pessoais?.sexo || 'masculino';
        const peso = parseFloat(answers.medidas_corporais?.peso_atual) || 70;
        const altura = parseFloat(answers.medidas_corporais?.altura) || 170;
        const objetivo = answers.objetivo || 'manter_peso';
        const nivelAtividade = answers.nivel_atividade || 'moderado';
        const historicoExercicios = answers.historico_exercicios || 'iniciante';

        // Fórmula de Harris-Benedict
        let tmb;
        if (sexo === 'masculino') {
            tmb = 88.362 + (13.397 * peso) + (4.799 * altura) - (5.677 * idade);
        } else {
            tmb = 447.593 + (9.247 * peso) + (3.098 * altura) - (4.330 * idade);
        }

        // Multiplicador de atividade baseado no nível e histórico
        let multiplicadorBase;
        const multiplicadores = {
            'sedentario': 1.2,
            'leve': 1.375,
            'moderado': 1.55,
            'ativo': 1.725,
            'atleta': 1.9
        };
        
        multiplicadorBase = multiplicadores[nivelAtividade] || 1.55;

        // Ajustar baseado no histórico de exercícios
        const ajustesHistorico = {
            'iniciante': 0.95, // Reduzir um pouco para iniciantes
            'intermediario': 1.0, // Manter
            'avancado': 1.05, // Aumentar um pouco
            'ex_atleta': 1.1, // Aumentar mais
            'personal_trainer': 1.15 // Aumentar ainda mais
        };

        const multiplicadorHistorico = ajustesHistorico[historicoExercicios] || 1.0;
        const caloriasBase = tmb * multiplicadorBase * multiplicadorHistorico;

        // Ajustar baseado no objetivo
        const ajustes = {
            'emagrecer': 0.8, // 20% de déficit
            'ganhar_massa': 1.2, // 20% de superávit
            'manter_peso': 1.0, // Manter
            'saude': 1.0, // Manter
            'forca': 1.15, // 15% de superávit para força
            'resistencia': 1.05, // 5% de superávit para resistência
            'flexibilidade': 1.0, // Manter para flexibilidade
            'reabilitacao': 0.95 // 5% de déficit para reabilitação
        };

        return Math.round(caloriasBase * (ajustes[objetivo] || 1.0));
    };

    const gerarPlanoTreino = (dadosUsuario) => {
        const frequencia = dadosUsuario.frequencia_treino;
        const acesso = dadosUsuario.acesso_academia;
        const objetivo = dadosUsuario.objetivo;

        let diasTreino = 3;
        if (frequencia === '2_3_vezes') diasTreino = 2;
        else if (frequencia === '3_4_vezes') diasTreino = 3;
        else if (frequencia === '4_5_vezes') diasTreino = 4;
        else if (frequencia === '5_6_vezes') diasTreino = 5;
        else if (frequencia === 'diario') diasTreino = 6;

        const plano = [];
        const tiposTreino = ['A', 'B', 'C', 'D', 'E', 'F'];

        for (let i = 0; i < diasTreino; i++) {
            const tipo = tiposTreino[i % tiposTreino.length];
            const intensidade = objetivo === 'emagrecer' ? 'moderada' : 'alta';
            
            plano.push({
                dia: i + 1,
                tipo: tipo,
                intensidade: intensidade,
                duracao: '45-60 min',
                concluido: false,
                exercicios: gerarExercicios(tipo, acesso, objetivo)
            });
        }

        return plano;
    };

    const gerarExercicios = (tipo, acesso, objetivo) => {
        const exercicios = [];
        
        if (acesso === 'academia_completa' || acesso === 'academia_basica') {
            if (tipo === 'A') {
                exercicios.push(
                    { nome: 'Supino Reto', series: 3, repeticoes: '8-12', peso: '70% 1RM' },
                    { nome: 'Agachamento', series: 3, repeticoes: '8-12', peso: '70% 1RM' },
                    { nome: 'Remada Curvada', series: 3, repeticoes: '8-12', peso: '70% 1RM' }
                );
            } else if (tipo === 'B') {
                exercicios.push(
                    { nome: 'Desenvolvimento Militar', series: 3, repeticoes: '8-12', peso: '70% 1RM' },
                    { nome: 'Levantamento Terra', series: 3, repeticoes: '6-8', peso: '80% 1RM' },
                    { nome: 'Puxada na Frente', series: 3, repeticoes: '8-12', peso: '70% 1RM' }
                );
            }
        } else {
            // Treino em casa
            exercicios.push(
                { nome: 'Flexões', series: 3, repeticoes: '10-20', peso: 'Peso corporal' },
                { nome: 'Agachamentos', series: 3, repeticoes: '15-25', peso: 'Peso corporal' },
                { nome: 'Prancha', series: 3, repeticoes: '30-60s', peso: 'Peso corporal' }
            );
        }

        return exercicios;
    };

    const nextStep = () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Finalizar quiz e salvar dados
            salvarDadosUsuario();
        }
    };

    const prevStep = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            if (isFromRegistration) {
                // Se veio do cadastro, não permitir voltar
                return;
            }
            navigation.goBack();
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>{currentQuestion.title}</Text>
            <View style={styles.progressBar}>
                {questions.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.progressSegment,
                            index <= step && styles.progressSegmentActive
                        ]}
                    />
                ))}
            </View>
            <Text style={styles.progressText}>{step + 1} de {questions.length}</Text>
        </View>
    );

    const renderOptions = () => {
        if (currentQuestion.type === 'form') return null;

        return (
            <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option) => {
                    const isSelected = currentQuestion.type === 'single' 
                        ? answers[currentQuestion.id] === option.id
                        : answers[currentQuestion.id]?.[option.id];

                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected
                            ]}
                            onPress={() => handleAnswer(currentQuestion.id, option.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.optionText,
                                isSelected && styles.optionTextSelected
                            ]}>
                                {option.text}
                            </Text>
                            {isSelected && (
                                <View style={styles.checkmark}>
                                    <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderForm = () => {
        if (currentQuestion.type !== 'form') return null;

        return (
            <View style={styles.formContainer}>
                {currentQuestion.fields.map((field) => (
                    <View key={field.id} style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{field.label}</Text>
                        
                        {field.type === 'single' ? (
                            // Renderizar opções para campos de seleção única
                            <View style={styles.optionsContainer}>
                                {field.options.map((option) => {
                                    const isSelected = answers[currentQuestion.id]?.[field.id] === option.id;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            style={[
                                                styles.optionButton,
                                                isSelected && styles.optionButtonSelected
                                            ]}
                                            onPress={() => handleAnswer(currentQuestion.id, field.id, option.id)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected
                                            ]}>
                                                {option.text}
                                            </Text>
                                            {isSelected && (
                                                <View style={styles.checkmark}>
                                                    <Text style={styles.checkmarkText}>✓</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            // Renderizar input normal para campos numéricos
                            <TextInput
                                style={styles.textInput}
                                value={answers[currentQuestion.id]?.[field.id] || ''}
                                onChangeText={(value) => {
                                    // Para campos numéricos, transformar vírgula em ponto
                                    if (field.type === 'numeric') {
                                        const processedValue = value.replace(',', '.');
                                        handleAnswer(currentQuestion.id, field.id, processedValue);
                                    } else {
                                        handleAnswer(currentQuestion.id, field.id, value);
                                    }
                                }}
                                placeholder={field.placeholder}
                                placeholderTextColor={colors.neutral[500]}
                                keyboardType={field.type === 'numeric' ? 'numeric' : 'default'}
                            />
                        )}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.neutral[900]} />
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {renderProgressBar()}
                
                <View style={styles.contentContainer}>
                    {renderOptions()}
                    {renderForm()}
                </View>
            </ScrollView>

            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={[
                        styles.navButton,
                        isFromRegistration && step === 0 && styles.navButtonDisabled
                    ]}
                    onPress={prevStep}
                    disabled={isFromRegistration && step === 0}
                    activeOpacity={0.8}
                >
                    <Text style={styles.navButtonText}>Anterior</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.navButton,
                        styles.nextButton,
                        (!canProceed() || carregando) && styles.nextButtonDisabled
                    ]}
                    onPress={nextStep}
                    disabled={!canProceed() || carregando}
                    activeOpacity={0.8}
                >
                    {carregando ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color={colors.neutral[50]} size="small" />
                            <Text style={styles.nextButtonText}>Salvando...</Text>
                        </View>
                    ) : (
                        <Text style={styles.nextButtonText}>
                            {step === questions.length - 1 ? 'Finalizar' : 'Próximo'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.neutral[900],
    },
    
    scrollView: {
        flex: 1,
    },
    
    progressContainer: {
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
    },
    
    progressTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.bold,
        color: colors.neutral[50],
        textAlign: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    
    progressBar: {
        flexDirection: 'row',
        gap: spacing.xs / 2,
        marginBottom: spacing.sm,
    },
    
    progressSegment: {
        width: 15,
        height: 2,
        backgroundColor: colors.neutral[700],
        borderRadius: 1,
    },
    
    progressSegmentActive: {
        backgroundColor: colors.primary[500],
    },
    
    progressText: {
        fontSize: typography.fontSize.sm,
        color: colors.neutral[400],
    },
    
    contentContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    
    optionsContainer: {
        gap: spacing.md,
    },
    
    optionButton: {
        backgroundColor: colors.neutral[800],
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.base,
        minHeight: 70,
    },
    
    optionButtonSelected: {
        backgroundColor: colors.primary[600],
    },
    
    optionText: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        color: colors.neutral[100],
        flex: 1,
    },
    
    optionTextSelected: {
        color: colors.neutral[50],
        fontWeight: typography.fontWeight.semibold,
    },
    
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.neutral[50],
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    checkmarkText: {
        color: colors.primary[600],
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.bold,
    },
    
    formContainer: {
        gap: spacing.lg,
        marginTop: spacing.lg,
    },
    
    inputContainer: {
        backgroundColor: colors.neutral[800],
        borderRadius: borders.radius.md,
        padding: spacing.md,
        ...shadows.base,
    },
    
    inputLabel: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.neutral[400],
        marginBottom: spacing.xs,
    },
    
    textInput: {
        fontSize: typography.fontSize.base,
        color: colors.neutral[50],
        paddingVertical: spacing.sm,
        paddingHorizontal: 0,
        minHeight: 40,
    },
    
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.neutral[900],
        borderTopWidth: 1,
        borderTopColor: colors.neutral[800],
    },
    
    navButton: {
        backgroundColor: colors.neutral[800],
        borderRadius: borders.radius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minWidth: 100,
        alignItems: 'center',
        ...shadows.base,
    },

    navButtonDisabled: {
        backgroundColor: colors.neutral[700],
        opacity: 0.5,
    },
    
    nextButton: {
        backgroundColor: colors.primary[600],
    },
    
    nextButtonDisabled: {
        backgroundColor: colors.neutral[700],
    },
    
    navButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.neutral[100],
    },
    
    nextButtonText: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.neutral[50],
    },

    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
});