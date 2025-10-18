/**
 * Script de configuração do backend NutriSnap.
 * Cria e atualiza o banco de dados, verifica dependências, variáveis de ambiente e chave Gemini.
 */

import 'dotenv/config'; // Carrega variáveis do .env
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

console.log('🚀 Configurando NutriSnap Backend...\n');

// --- 1. SEU ESQUEMA SQL COMPLETO ---
// O comando 'USE nutrisnap;' é CRÍTICO para o script funcionar
const schemaSQL = `
CREATE DATABASE IF NOT EXISTS nutrisnap DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutrisnap;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE, 
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS codigos_verificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    codigo VARCHAR(6) NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS refeicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    itens JSON NOT NULL,
    calorias_totais DECIMAL(8,2) NOT NULL,
    proteinas_totais DECIMAL(8,2) DEFAULT 0,
    carboidratos_totais DECIMAL(8,2) DEFAULT 0,
    gorduras_totais DECIMAL(8,2) DEFAULT 0,
    tipo_refeicao VARCHAR(50) DEFAULT 'outros',
    observacoes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS metas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    peso_atual FLOAT NOT NULL,
    peso_meta FLOAT NOT NULL,
    dias INT NOT NULL,
    calorias_diarias INT NOT NULL,
    metas_nutricionais JSON,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    plano JSON NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meus_dados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    idade INT,
    sexo VARCHAR(20),
    altura FLOAT,
    peso_atual FLOAT,
    peso_meta FLOAT,
    objetivo VARCHAR(50),
    nivel_atividade VARCHAR(50),
    frequencia_treino VARCHAR(50),
    acesso_academia VARCHAR(50),
    dieta_atual VARCHAR(50),
    preferencias JSON,
    habitos_alimentares JSON,
    restricoes_medicas JSON,
    historico_exercicios VARCHAR(50),
    tipo_treino_preferido JSON,
    horario_preferido VARCHAR(50),
    duracao_treino VARCHAR(50),
    metas_especificas JSON,
    motivacao VARCHAR(50),
    obstaculos JSON,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_quiz (id_usuario)
);
`;


/**
 * Cria e atualiza o banco de dados MySQL, executando o schema.sql e garantindo colunas extras.
 */
async function configurarBanco() {
    let conexao;
    try {
        // Conecta ao MySQL sem especificar banco para poder criar o banco se não existir
        conexao = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '123456'
        });

        console.log('✅ Conectado ao MySQL');

        // Divide o schema em instruções SQL individuais
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        // Executa cada instrução SQL separadamente. O comando 'USE nutrisnap'
        // garantirá que os comandos CREATE TABLE subsequentes sejam executados no contexto certo.
        for (const statement of statements) {
            await conexao.query(statement);
        }
        console.log('✅ Banco de dados "nutrisnap" e tabelas criadas/atualizadas!');


        // --- Verificação de Coluna Opcional (mantida para robustez) ---
        // Garante que a conexão está no contexto do banco
        await conexao.query('USE nutrisnap');
        
        // Exemplo: Verificação da coluna metas_nutricionais (pode ser removida se o schema for a fonte única de verdade)
        try {
            const [colunas] = await conexao.query('DESCRIBE metas');
            const colunaExiste = colunas.some(col => col.Field === 'metas_nutricionais');
            if (!colunaExiste) {
                console.log('📝 Adicionando coluna metas_nutricionais à tabela metas...');
                await conexao.query('ALTER TABLE metas ADD COLUMN metas_nutricionais JSON AFTER calorias_diarias');
                console.log('✅ Coluna metas_nutricionais adicionada com sucesso');
            } else {
                console.log('✅ Coluna metas_nutricionais já existe');
            }
        } catch (err) {
            // Ignora se a tabela 'metas' ainda não existe
            if (!err.message.includes("doesn't exist")) {
                 console.log('⚠️ Erro ao verificar/atualizar tabela metas:', err.message);
            }
        }


        // Mostra as tabelas criadas
        const [tabelas] = await conexao.query('SHOW TABLES');
        console.log('📊 Tabelas criadas:', tabelas.map(t => Object.values(t)[0]).join(', '));

        // Cria usuário de teste se solicitado
        const criarUsuarioTeste = process.argv.includes('--create-test-user');
        if (criarUsuarioTeste) {
            const bcrypt = await import('bcryptjs');
            const senhaHash = await bcrypt.hash('Teste123', 12);
            await conexao.query(`
                INSERT INTO usuarios (nome, email, senha, email_verificado) 
                VALUES ('Usuário Teste', 'teste@nutrisnap.com', ?, TRUE)
                ON DUPLICATE KEY UPDATE nome = VALUES(nome)
            `, [senhaHash]);
            console.log('👤 Usuário de teste criado: teste@nutrisnap.com / Teste123');
        }

    } catch (erro) {
        console.error('❌ Erro ao configurar banco:', erro.message);
        if (erro.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Verifique suas credenciais no arquivo .env.');
        }
        process.exit(1);
    } finally {
        if (conexao) {
            await conexao.end();
        }
    }
}


/**
 * Verifica e instala dependências do projeto (npm install se necessário).
 */
async function verificarDependencias() {
    console.log('📦 Verificando dependências...');
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencias = Object.keys(packageJson.dependencies || {});
        if (dependencias.length === 0) return;

        console.log(`✅ ${dependencias.length} dependências encontradas`);
        if (!fs.existsSync('node_modules')) {
            console.log('📥 Instalando dependências...');
            const { execSync } = await import('child_process');
            execSync('npm install', { stdio: 'inherit' });
            console.log('✅ Dependências instaladas');
        } else {
            console.log('✅ Dependências já instaladas');
        }
    } catch (erro) {
        console.error('❌ Erro ao verificar dependências:', erro.message);
    }
}


/**
 * Verifica se o arquivo .env existe.
 */
async function verificarArquivoEnv() {
    console.log('🔧 Verificando arquivo de ambiente...');
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.log('⚠️ Arquivo .env não encontrado.');
    } else {
        console.log('✅ Arquivo .env encontrado');
    }
}


/**
 * Verifica se a chave da API Gemini está configurada no .env.
 */
async function verificarChaveGemini() {
    console.log('🔑 Verificando chave da API Gemini...');
    const chaveGemini = process.env.GEMINI_API_KEY;
    if (!chaveGemini || chaveGemini.length < 5) {
        console.log('⚠️ GEMINI_API_KEY não configurada. Configure para usar análise de imagens.');
    } else {
        console.log('✅ GEMINI_API_KEY configurada');
    }
}


/**
 * Função principal: executa todas as etapas de verificação e configuração do backend.
 */
async function main() {
    try {
        await verificarDependencias();
        await verificarArquivoEnv();
        await verificarChaveGemini();
        await configurarBanco();
        console.log('\n🎉 Configuração concluída com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Inicie o servidor: npm run dev');
    } catch (erro) {
        console.error('\n❌ Configuração falhou:', erro.message);
        process.exit(1);
    }
}

// Executa o script principal
main();