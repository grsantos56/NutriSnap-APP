import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração da API
export const URL_BASE = 'http://192.168.0.60:3000';

// Função para buscar dados da API
export async function buscarApi(endpoint, opcoes = {}) {
  try {
    const { method = 'GET', token, body, headers = {} } = opcoes;
    
    // Configurar headers
    const headersConfig = {
      'Content-Type': 'application/json',
      ...headers
    };
    
    // Adicionar token de autenticação se fornecido
    if (token) {
      headersConfig.Authorization = `Bearer ${token}`;
    }
    
    // Configurar opções da requisição
    const config = {
      method,
      headers: headersConfig,
    };
    
    // Adicionar body para métodos POST, PUT, PATCH
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(body);
    }
    
    console.log(`🌐 API Request: ${method} ${URL_BASE}${endpoint}`);
    if (body) console.log('📦 Body:', body);
    
    // Fazer a requisição
    const resposta = await fetch(`${URL_BASE}${endpoint}`, config);
    
    console.log(`📡 API Response: ${resposta.status} ${resposta.statusText}`);
    
    // Verificar se a resposta é ok
    if (!resposta.ok) {
      let mensagemErro = 'Erro na requisição';
      
      try {
        const erroData = await resposta.json();
        mensagemErro = erroData.mensagem || erroData.message || mensagemErro;
      } catch {
        mensagemErro = resposta.statusText || mensagemErro;
      }
      
      const erro = new Error(mensagemErro);
      erro.status = resposta.status;
      erro.response = resposta;
      throw erro;
    }
    
    // Tentar fazer parse da resposta como JSON
    try {
      const dados = await resposta.json();
      console.log('✅ API Success:', dados);
      return dados;
    } catch (erroParse) {
      console.log('⚠️ Resposta não é JSON válido, retornando texto');
      return await resposta.text();
    }
    
  } catch (erro) {
    console.error('❌ API Error:', erro);
    
    // Se for erro de rede, adicionar contexto
    if (erro.name === 'TypeError' && erro.message.includes('fetch')) {
      erro.message = 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    
    throw erro;
  }
}

// Funções específicas para autenticação
export async function registrarUsuario(dados) {
  return buscarApi('/api/autenticacao/registrar', {
    method: 'POST',
    body: dados
  });
}

export async function fazerLogin(dados) {
  return buscarApi('/api/autenticacao/entrar', {
    method: 'POST',
    body: dados
  });
}

export async function verificarToken(token) {
  return buscarApi('/api/autenticacao/verificar', {
    method: 'GET',
    token
  });
}

// Funções para usuários
export async function buscarPerfilUsuario(token) {
  return buscarApi('/api/usuarios/perfil', {
    method: 'GET',
    token
  });
}

export async function atualizarPerfilUsuario(token, dados) {
  return buscarApi('/api/usuarios/perfil', {
    method: 'PUT',
    token,
    body: dados
  });
}

// Funções para quiz
export async function buscarQuizUsuario(token) {
  return buscarApi('/api/quiz', {
    method: 'GET',
    token
  });
}

export async function salvarQuizUsuario(token, dados) {
  return buscarApi('/api/quiz', {
    method: 'POST',
    token,
    body: dados
  });
}

export async function deletarQuizUsuario(token) {
  return buscarApi('/api/quiz', {
    method: 'DELETE',
    token
  });
}

// Funções para refeições
export async function buscarRefeicoes(token) {
  return buscarApi('/api/refeicoes', {
    method: 'GET',
    token
  });
}

export async function salvarRefeicao(token, dados) {
  return buscarApi('/api/refeicoes', {
    method: 'POST',
    token,
    body: dados
  });
}

export async function atualizarRefeicao(token, id, dados) {
  return buscarApi(`/api/refeicoes/${id}`, {
    method: 'PUT',
    token,
    body: dados
  });
}

export async function deletarRefeicao(token, id) {
  return buscarApi(`/api/refeicoes/${id}`, {
    method: 'DELETE',
    token
  });
}

// Funções para metas
export async function buscarMetas(token) {
  return buscarApi('/api/metas', {
    method: 'GET',
    token
  });
}

export async function salvarMetas(token, dados) {
  return buscarApi('/api/metas', {
    method: 'POST',
    token,
    body: dados
  });
}

// função para gerar metas nutricionais com IA
export async function gerarMetasNutricionais(token) {
  return buscarApi('/api/metas/gerar-ia', {
    method: 'POST',
    token,
    body: {}
  });
}

// Funções para treinos
export async function buscarTreinos(token) {
  return buscarApi('/api/treinos', {
    method: 'GET',
    token
  });
}

export async function salvarTreino(token, dados) {
  return buscarApi('/api/treinos', {
    method: 'POST',
    token,
    body: dados
  });
}

export async function atualizarTreino(token, dados) {
  return buscarApi('/api/treinos', {
    method: 'PUT',
    token,
    body: dados
  });
}

export async function gerarPlanoTreino(token) {
  return buscarApi('/api/treinos/gerar', {
    method: 'POST',
    token,
    body: {}
  });
}

// Funções para análise de imagens
export async function analisarImagem(token, dadosImagem) {
  return buscarApi('/api/analise', {
    method: 'POST',
    token,
    body: dadosImagem
  });
}

// Função para verificar saúde da API
export async function verificarSaudeAPI() {
  return buscarApi('/api/saude', {
    method: 'GET'
  });
}

// Função para limpar dados locais
export async function limparDadosLocais() {
  try {
    await AsyncStorage.multiRemove([
      'token',
      'usuario',
      'dadosQuiz',
      'metas',
      'treinos',
      'refeicoes'
    ]);
    console.log('✅ Dados locais limpos com sucesso');
  } catch (erro) {
    console.error('❌ Erro ao limpar dados locais:', erro);
  }
}

// Função para fazer logout
export async function fazerLogout() {
  try {
    await limparDadosLocais();
    console.log('✅ Logout realizado com sucesso');
  } catch (erro) {
    console.error('❌ Erro ao fazer logout:', erro);
  }
}

// Função para testar conectividade
export async function testarConectividade() {
  try {
    const resposta = await verificarSaudeAPI();
    return {
      conectado: true,
      dados: resposta
    };
  } catch (erro) {
    return {
      conectado: false,
      erro: erro.message
    };
  }
}

// Função para reautenticar usuário
export async function reautenticarUsuario(tokenAtual) {
  try {
    const dados = await verificarToken(tokenAtual);
    if (dados.valido) {
      return {
        sucesso: true,
        usuario: dados.usuario
      };
    } else {
      throw new Error('Token inválido');
    }
  } catch (erro) {
    console.error('❌ Erro na reautenticação:', erro);
    return {
      sucesso: false,
      erro: erro.message
    };
  }
}

// Alterar a senha do usuário
export async function alterarSenhaAPI(token, senhaAtual, novaSenha) {
  try {
    const resposta = await buscarApi('/api/usuarios/alterar-senha', {
      method: 'PUT',
      token,
      body: {
        senhaAtual,
        novaSenha,
      },
    });
    return resposta;
  } catch (erro) {
    console.error('❌ Erro na função alterarSenhaAPI:', erro);
    return {
      sucesso: false,
      mensagem: 'Erro de conexão. Verifique sua rede.',
    };
  }
}

export const buscarMeusDados = async (token) => {
  try {
    // '/api/quiz' é o endpoint definido no seu server.js para o meusdados.js
    const dados = await buscarApi('/api/quiz', { token });
    console.log('👤 Meus Dados carregados:', dados);
    return dados;
  } catch (erro) {
    console.error('❌ Erro ao buscar "Meus Dados":', erro);
    // Retornar null ou lançar o erro, dependendo de como você quer tratar falhas
    return null;
  }
};

// Atualizar metas
export async function atualizarMetas(token, dados) {
  return buscarApi('/api/metas/atualizar', {
    method: 'PUT',
    token,
    body: dados,
  });
}



// Função de compatibilidade para manter código existente funcionando
export const testarConexao = testarConectividade;
