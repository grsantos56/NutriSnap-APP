import { z } from 'zod';
import AuthModel from '../models/auth.js';
import CodigosModel from '../models/codigos.js'; // NOVO
import { enviarEmailCodigo } from '../utils/emailUtils.js'; // NOVO
import { esquemaRegistro, esquemaLogin } from '../utils/validation.js';
import bcrypt from 'bcrypt'; // Usado para hash da senha (já que o AuthModel não lida com hash)

class AuthController {

    /**
     * Lida com o registro de um novo usuário (PRÉ-VERIFICAÇÃO).
     * O usuário final só é criado após a verificação do email.
     */
    static async registrar(req, res) {
        try {
            const dadosValidados = esquemaRegistro.parse(req.body);
            const { nome, email, senha } = dadosValidados;

            // 1. CHECA SE EMAIL JÁ FOI VERIFICADO ANTES
            const usuarioExistente = await AuthModel.encontrarPorEmail(email);

            if (usuarioExistente && usuarioExistente.email_verificado) {
                return res.status(409).json({
                    mensagem: 'Email já está cadastrado e verificado.'
                });
            }
            
            // 2. Hash da senha
            const saltRounds = 10;
            const senha_hash = await bcrypt.hash(senha, saltRounds);

            // 3. Gerar código e ARMAZENAR DADOS TEMPORARIAMENTE
            const codigo = Math.floor(100000 + Math.random() * 900000).toString();
            
            // O CodigosModel agora armazena os dados de registro pendentes (nome, email, senha_hash)
            await CodigosModel.salvarRegistroPendente({ 
                nome, 
                email, 
                senha_hash, 
                codigo 
            });

            // 4. Enviar código por email
            await enviarEmailCodigo(email, codigo);

            console.log(`✅ Registro pendente salvo e código enviado para: ${email}`);
            
            // Resposta de sucesso, indicando que o usuário deve verificar
            res.status(202).json({
                mensagem: 'Cadastro iniciado! Código de verificação enviado para seu email.',
                email: email // Retorna o email para uso na próxima tela
            });

        } catch (erro) {
            console.error('❌ Erro no registro (pré-verificação):', erro);
            if (erro instanceof z.ZodError) {
                return res.status(400).json({
                    mensagem: 'Dados inválidos',
                    detalhes: erro.errors.map(e => e.message)
                });
            }
            res.status(500).json({ 
                mensagem: 'Erro interno ao iniciar cadastro. Tente novamente.',
                detalhes: erro.message 
            });
        }
    }

    /**
     * Lida com o login do usuário.
     */
    static async entrar(req, res) {
        try {
            const dadosValidados = esquemaLogin.parse(req.body);
            const usuario = await AuthModel.encontrarPorEmail(dadosValidados.email);

            if (!usuario || !(await AuthModel.compararSenha(dadosValidados.senha, usuario.senha))) {
                return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
            }
            
            // BLOQUEIO DE SEGURANÇA: Exige verificação de email
            if (!usuario.email_verificado) {
                return res.status(403).json({ 
                    mensagem: 'Conta não verificada. Verifique seu email para acessar.',
                    acao: 'VERIFICACAO_REQUERIDA' // Indica ao frontend para ir para a tela de verificação
                });
            }

            const token = AuthModel.gerarToken(usuario);

            console.log(`✅ Login realizado: ${usuario.email} (ID: ${usuario.id})`);
            res.json({
                token,
                usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
                mensagem: 'Login realizado com sucesso!'
            });

        } catch (erro) {
            console.error('❌ Erro no login:', erro);
            if (erro instanceof z.ZodError) {
                return res.status(400).json({
                    mensagem: 'Dados inválidos',
                    detalhes: erro.errors.map(e => e.message)
                });
            }
            res.status(500).json({ mensagem: 'Erro interno do servidor. Tente novamente.' });
        }
    }

    /**
     * Lida com a verificação de um token JWT.
     */
    static async verificar(req, res) {
        try {
            const cabecalho = req.headers.authorization || '';
            const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;

            if (!token) {
                return res.status(401).json({ mensagem: 'Token ausente', valido: false });
            }

            const decodificado = AuthModel.verificarToken(token);
            const usuario = await AuthModel.encontrarPorId(decodificado.id);

            if (!usuario) {
                return res.status(401).json({ mensagem: 'Usuário não encontrado', valido: false });
            }

            res.json({
                valido: true,
                usuario,
                mensagem: 'Token válido'
            });

        } catch (erro) {
            console.error('❌ Erro na verificação:', erro);
            res.status(401).json({ mensagem: 'Token inválido', valido: false });
        }
    }
}

export default AuthController;