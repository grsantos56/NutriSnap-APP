import bancoDados from '../config/db.js';
import bcrypt from 'bcrypt';

class UsuariosModel {

    /**
     * Busca os dados completos do perfil de um usuário pelo ID.
     * @param {number} idUsuario - ID do usuário.
     * @returns {Promise<object|null>} Dados do usuário e quiz, ou null.
     */
    static async buscarPerfilCompleto(idUsuario) {
        const [usuarios] = await bancoDados.query(
            // CORRIGIDO: Removida a coluna 'foto'
            'SELECT id, nome, email, criado_em, email_verificado FROM usuarios WHERE id = ?',
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return null;
        }

        const usuario = usuarios[0];

        const [quizData] = await bancoDados.query(
            'SELECT idade, sexo, altura, peso_atual, peso_meta, objetivo, nivel_atividade FROM meus_dados WHERE id_usuario = ?',
            [idUsuario]
        );

        if (quizData.length > 0) {
            Object.assign(usuario, quizData[0]);
        }

        return usuario;
    }

    /**
     * Busca um usuário pelo email.
     * @param {string} email - Email do usuário.
     * @returns {Promise<object|null>} Dados do usuário ou null.
     */
    static async buscarPorEmail(email) {
        const [usuarios] = await bancoDados.query( 
            // CORRIGIDO: Removida a coluna 'foto'
            'SELECT id, nome, email, criado_em, email_verificado FROM usuarios WHERE email = ?',
            [email]
        );
        return usuarios[0] || null;
    }

    
    /**
     * Atualiza os dados de perfil de um usuário.
     * @param {number} idUsuario - ID do usuário.
     * @param {object} dados - Dados a serem atualizados.
     */
    static async atualizarPerfil(idUsuario, dados) {
        // Atualiza dados básicos
        await bancoDados.query(
            'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
            [dados.nome, dados.email, idUsuario]
        );

        // Atualiza/insere dados do quiz
        const [quizExistente] = await bancoDados.query(
            'SELECT id FROM meus_dados WHERE id_usuario = ?',
            [idUsuario]
        );

        if (quizExistente.length > 0) {
            await bancoDados.query(`
                UPDATE meus_dados SET
                idade = ?, sexo = ?, altura = ?, peso_atual = ?, peso_meta = ?,
                objetivo = ?, nivel_atividade = ?, atualizado_em = CURRENT_TIMESTAMP
                WHERE id_usuario = ?
            `, [
                dados.idade || null, dados.sexo || null, dados.altura || null,
                dados.peso_atual || null, dados.peso_meta || null,
                dados.objetivo || null, dados.nivel_atividade || null, idUsuario
            ]);
        } else if (Object.keys(dados).some(k => ['idade', 'sexo', 'altura', 'peso_atual', 'peso_meta', 'objetivo', 'nivel_atividade'].includes(k))) {
            await bancoDados.query(`
                INSERT INTO meus_dados (
                id_usuario, idade, sexo, altura, peso_atual, peso_meta,
                objetivo, nivel_atividade
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                idUsuario, dados.idade || null, dados.sexo || null, dados.altura || null,
                dados.peso_atual || null, dados.peso_meta || null, dados.objetivo || null, dados.nivel_atividade || null
            ]);
        }
    }

    /**
     * Altera a senha do usuário.
     * @param {number} idUsuario - ID do usuário.
     * @param {string} novaSenha - Nova senha em texto puro.
     */
    static async alterarSenha(idUsuario, novaSenha) {
        if (!novaSenha) return;
        const saltRounds = 10;
        const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);
        await bancoDados.query(
            'UPDATE usuarios SET senha = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
            [novaSenhaHash, idUsuario]
        );
    }

    /**
     * Busca o hash da senha de um usuário.
     * @param {number} idUsuario - ID do usuário.
     * @returns {Promise<string|null>} Hash da senha ou null.
     */
    static async buscarHashSenha(idUsuario) {
        const [usuarios] = await bancoDados.query(
            'SELECT senha FROM usuarios WHERE id = ?',
            [idUsuario]
        );
        return usuarios[0]?.senha || null;
    }

    // =======================================
    // MARCAR EMAIL VERIFICADO
    // =======================================

    /**
     * Marca o email do usuário como verificado no banco de dados.
     * @param {number} idUsuario - ID do usuário.
     */
    static async marcarEmailVerificado(idUsuario) {
        await bancoDados.query(
            'UPDATE usuarios SET email_verificado = TRUE, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?',
            [idUsuario]
        );
    }
    /**
     * Cria um novo usuário na tabela principal (usuarios) usando a senha JÁ hasheada.
     * Este é o 'COMMIT' final do registro.
     * @param {object} dados - Dados finais do usuário.
     * @returns {Promise<object>} Dados do usuário criado.
     */
    static async criarUsuarioComHash({ nome, email, senha_hash, email_verificado = true }) {
        const [resultado] = await bancoDados.query(
            `
            INSERT INTO usuarios (nome, email, senha, email_verificado) 
            VALUES (?, ?, ?, ?)
            `,
            [nome, email, senha_hash, email_verificado]
        );

        // Retorna os dados básicos do usuário, incluindo o ID inserido
        return { 
            id: resultado.insertId, 
            nome, 
            email, 
            email_verificado
        };
    }
}

export default UsuariosModel;