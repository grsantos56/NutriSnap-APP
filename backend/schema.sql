CREATE DATABASE IF NOT EXISTS nutrisnap DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nutrisnap;

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE, 
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para armazenar dados de REGISTRO PENDENTE e código de verificação
CREATE TABLE IF NOT EXISTS codigos_verificacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    codigo VARCHAR(6) NOT NULL,
    expira_em DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: refeicoes
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

-- Tabela: metas
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

-- Tabela: treinos
CREATE TABLE IF NOT EXISTS treinos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    plano JSON NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela: meus_dados
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