import bancoDados from '../config/db.js';

class CodigosModel {

    /**
     * Salva ou atualiza um registro de usuário PENDENTE.
     * @param {object} dados - Dados temporários de registro.
     * @param {string} dados.nome - Nome do usuário.
     * @param {string} dados.email - Email do usuário.
     * @param {string} dados.senha_hash - Senha hasheada.
     * @param {string} dados.codigo - Código de 6 dígitos.
     */
    static async salvarRegistroPendente({ nome, email, senha_hash, codigo }) {
        // Define a data de expiração (15 minutos)
        const expiraEm = new Date(Date.now() + 15 * 60000);

        // Tenta inserir ou atualizar (UPSERT)
        await bancoDados.query(
            `
            INSERT INTO codigos_verificacao (nome, email, senha_hash, codigo, expira_em) 
            VALUES (?, ?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
                nome = VALUES(nome),
                senha_hash = VALUES(senha_hash),
                codigo = VALUES(codigo), 
                expira_em = VALUES(expira_em),
                criado_em = CURRENT_TIMESTAMP
            `,
            [nome, email, senha_hash, codigo, expiraEm]
        );
    }

    /**
     * Busca um registro pendente pelo email (usado pela rota de Reenvio/Envio).
     * @param {string} email - Email do registro pendente.
     * @returns {Promise<object|null>} Dados do registro pendente ou null.
     */
    static async buscarRegistroPendente(email) {
        const [resultados] = await bancoDados.query(
            'SELECT nome, email, senha_hash, codigo, expira_em FROM codigos_verificacao WHERE email = ?',
            [email]
        );
        return resultados[0] || null;
    }

    /**
     * Valida um código de verificação, consome o registro pendente e o retorna.
     * @param {string} email - Email do usuário.
     * @param {string} codigo - Código fornecido pelo usuário.
     * @returns {Promise<object|'EXPIRADO'|'INVALIDO'>} Dados de registro ou status de erro.
     */
    static async validarEConsumirRegistro(email, codigo) {
        const [resultados] = await bancoDados.query(
            'SELECT nome, email, senha_hash, codigo, expira_em FROM codigos_verificacao WHERE email = ?',
            [email]
        );

        if (resultados.length === 0) {
            return 'INVALIDO';
        }

        const registro = resultados[0];
        const agora = new Date();
        const expiraEm = new Date(registro.expira_em);

        // 1. Verifica se o código expirou
        if (agora > expiraEm) {
            await this.deletarRegistroPendente(email);
            return 'EXPIRADO';
        }

        // 2. Verifica se o código corresponde
        if (registro.codigo === codigo) {
            // SUCESSO: Deleta o registro pendente
            await this.deletarRegistroPendente(email);
            
            // Retorna os dados para a criação final do usuário (no UsuariosModel)
            return {
                nome: registro.nome,
                email: registro.email,
                senha_hash: registro.senha_hash,
            };
        }

        return 'INVALIDO';
    }

    /**
     * Deleta o registro pendente (após uso, expiração, ou falha de criação).
     */
    static async deletarRegistroPendente(email) {
        await bancoDados.query(
            'DELETE FROM codigos_verificacao WHERE email = ?',
            [email]
        );
    }
}

export default CodigosModel;