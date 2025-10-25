import fetch from 'node-fetch';

/**
 * Encapsula a lógica de interação com a API Gemini para análise de refeições.
 */
class AnaliseModel {

    /**
     * @param {string} dadosImagemBase64 - Imagem em Base64.
     * @param {object} [infoAdicionais] - Dados extras para o prompt (pesoTotal, quantidadeItens, descricaoRefeicao).
     * @returns {Promise<object>} Objeto JSON com a análise nutricional.
     */
    static async analisarImagemComGemini(dadosImagemBase64, infoAdicionais = {}) {
        // CORREÇÃO: Removemos a chave hardcoded e mantemos apenas o ambiente
        const chave = process.env.GEMINI_API_KEY; 
        
        // Verifica se a chave está faltando ou usando um placeholder
        if (!chave || chave === 'sua_chave_gemini_aqui') { 
            throw new Error('GEMINI_API_KEY não configurada no arquivo .env.');
        }

        const urlApi = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${chave}`;

        const prompt = this.construirPrompt(infoAdicionais);

        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: 'image/jpeg', data: dadosImagemBase64 } }
                ]
            }],
            generationConfig: { responseMimeType: 'application/json' }
        };

        const resposta = await fetch(urlApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await resposta.json();
        return this.processarResposta(json);
    }

    /**
     * Constrói o prompt detalhado para a API Gemini.
     * @param {object} infoAdicionais
     * @returns {string} Prompt completo.
     */
    static construirPrompt(infoAdicionais) {
        let prompt = `Analise esta imagem de uma refeição. Identifique cada item e forneça informações nutricionais completas.

        Para cada alimento identificado, estime:
        - Nome do alimento
        - Calorias (kcal)
        - Proteínas (g)
        - Carboidratos (g)
        - Gorduras (g)`;

        const { pesoTotal, quantidadeItens, descricaoRefeicao } = infoAdicionais;
        const informacoesAdicionais = [];
        if (pesoTotal) informacoesAdicionais.push(`- Peso total da refeição: ${pesoTotal} gramas`);
        if (quantidadeItens) informacoesAdicionais.push(`- Quantidade de itens: ${quantidadeItens}`);
        if (descricaoRefeicao) informacoesAdicionais.push(`- Descrição da refeição: ${descricaoRefeicao}`);

        if (informacoesAdicionais.length > 0) {
            prompt += `\n\nINFORMAÇÕES ADICIONAIS:\n${informacoesAdicionais.join('\n')}\n\nUse essas informações para uma análise mais precisa e contextualizada.
            Se há quantidade de itens especificada, divida os valores nutricionais pela quantidade de itens para obter a porção individual de cada item.
            A descrição pode ajudar a identificar melhor os alimentos e suas preparações.`;
        }

        prompt += `\n\nResponda APENAS com JSON puro, sem explicações, sem blocos de código, sem texto extra.

        Formato esperado:
        {
            "itens": [
                {
                    "nome": "Arroz Integral",
                    "calorias": 120,
                    "proteinas": 2.5,
                    "carboidratos": 25.0,
                    "gorduras": 0.8
                }
            ],
            "caloriasTotais": 120,
            "proteinasTotais": 2.5,
            "carboidratosTotais": 25.0,
            "gordurasTotais": 0.8
        }

        IMPORTANTE: Sempre inclua todos os campos nutricionais para cada item. Se não conseguir estimar algum valor, use 0.`;

        return prompt;
    }

    /**
     * Processa e normaliza a resposta JSON da API Gemini.
     * @param {object} json - Resposta da API.
     * @returns {object} Dados normalizados.
     */
    static async processarResposta(json) {
        // Verifica se o Gemini retornou um erro (ex: chave inválida ou problema na requisição)
        if (json.error) {
            throw new Error(`Erro da API Gemini: ${json.error.message || 'Erro desconhecido.'}`);
        }
        
        const texto = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const limpo = texto.replace(/```json|```/g, '').trim();

        let dados;
        try {
            dados = JSON.parse(limpo);
        } catch {
            const match = limpo.match(/{[\s\S]+}/);
            dados = match ? JSON.parse(match[0]) : null;
        }

        if (!dados || !dados.itens || !Array.isArray(dados.itens)) {
            // Lança um erro mais específico se a resposta do modelo for inválida
            throw new Error('Resposta do modelo inválida ou formato inesperado.');
        }

        // Normalização dos itens e cálculo dos totais
        dados.itens = dados.itens.map(item => ({
            nome: item.nome || 'Alimento não identificado',
            calorias: parseFloat(item.calorias) || 0,
            proteinas: parseFloat(item.proteinas) || 0,
            carboidratos: parseFloat(item.carboidratos) || 0,
            gorduras: parseFloat(item.gorduras) || 0
        }));

        const caloriasTotais = dados.itens.reduce((soma, item) => soma + item.calorias, 0);
        const proteinasTotais = dados.itens.reduce((soma, item) => soma + item.proteinas, 0);
        const carboidratosTotais = dados.itens.reduce((soma, item) => soma + item.carboidratos, 0);
        const gordurasTotais = dados.itens.reduce((soma, item) => soma + item.gorduras, 0);

        return {
            itens: dados.itens,
            caloriasTotais,
            proteinasTotais,
            carboidratosTotais,
            gordurasTotais
        };
    }
}

export default AnaliseModel;