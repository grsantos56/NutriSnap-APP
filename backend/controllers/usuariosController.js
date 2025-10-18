import UsuariosModel from '../models/usuarios.js';
import CodigosModel from '../models/codigos.js'; // Novo: Para gerenciar os códigos de verificação
import { enviarEmailCodigo } from '../utils/emailUtils.js'; // Novo: Para enviar o e-mail
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AuthModel from '../models/auth.js';
// REMOVIDO: import fetch from 'node-fetch'; // Não é mais necessário

class UsuariosController {

    // =======================================
    // BUSCAR PERFIL
    // =======================================
    static async buscarPerfil(req, res) {
        try {
            const usuario = await UsuariosModel.buscarPerfilCompleto(req.idUsuario);
            if (!usuario) {
                return res.status(404).json({ mensagem: 'Usuário não encontrado' });
            }
            res.json(usuario);
        } catch (erro) {
            console.error('❌ Erro ao buscar perfil:', erro);
            res.status(500).json({ mensagem: 'Erro ao buscar perfil do usuário', erro: erro.message });
        }
    }

    // =======================================
    // ATUALIZAR PERFIL
    // =======================================
    static async atualizarPerfil(req, res) {
        try {
            const { nome, email } = req.body;
            if (!nome || !email) {
                return res.status(400).json({ mensagem: 'Nome e email são obrigatórios' });
            }

            const usuarioComMesmoEmail = await UsuariosModel.buscarPorEmail(email);
            if (usuarioComMesmoEmail && usuarioComMesmoEmail.id !== req.idUsuario) {
                return res.status(400).json({ mensagem: 'Este email já está em uso por outro usuário' });
            }

            await UsuariosModel.atualizarPerfil(req.idUsuario, req.body);
            console.log(`✅ Perfil atualizado para usuário ${req.idUsuario}`);
            res.json({ mensagem: 'Perfil atualizado com sucesso', usuario: req.body });
        } catch (erro) {
            console.error('❌ Erro ao atualizar perfil:', erro);
            res.status(500).json({ mensagem: 'Erro ao atualizar perfil do usuário', erro: erro.message });
        }
    }

    // =======================================
    // ALTERAR SENHA
    // =======================================
    static async alterarSenha(req, res) {
        const { senhaAtual, novaSenha } = req.body;
        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ mensagem: 'Senha atual e nova senha são obrigatórias.' });
        }

        try {
            const hashSenhaArmazenada = await UsuariosModel.buscarHashSenha(req.idUsuario);
            if (!hashSenhaArmazenada) {
                return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
            }

            const senhaValida = await bcrypt.compare(senhaAtual, hashSenhaArmazenada);
            if (!senhaValida) {
                return res.status(401).json({ mensagem: 'Senha atual incorreta.' });
            }

            await UsuariosModel.alterarSenha(req.idUsuario, novaSenha);
            console.log(`✅ Senha alterada com sucesso para o usuário ${req.idUsuario}`);
            res.json({ mensagem: 'Senha alterada com sucesso!' });
        } catch (erro) {
            console.error('❌ Erro ao alterar a senha:', erro);
            res.status(500).json({ mensagem: 'Erro ao alterar a senha do usuário.', erro: erro.message });
        }
    }

    // =======================================
    // ENVIAR CÓDIGO DE VERIFICAÇÃO (Novo)
    // =======================================
    static async enviarCodigoVerificacao(req, res) {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ mensagem: 'O email é obrigatório.' });
        }

        try {
            // Buscamos o REGISTRO PENDENTE
            // Nota: Assumimos que o CodigosModel.buscarRegistroPendente(email) existe
            const registroPendente = await CodigosModel.buscarRegistroPendente(email); 

            if (!registroPendente) {
                console.log(`✉️ Tentativa de código para email não pendente: ${email}`);
                return res.json({ mensagem: 'Processo de verificação iniciado.' }); 
            }

            const codigo = registroPendente.codigo;
            
            await enviarEmailCodigo(email, codigo);

            console.log(`✅ Código de verificação enviado para o email pendente: ${email}.`);
            return res.json({ mensagem: 'Código de verificação enviado para o seu email.' });

        } catch (erro) {
            console.error('❌ Erro ao enviar código:', erro);
            res.status(500).json({ mensagem: 'Erro ao processar a solicitação de código.' });
        }
    }

    // =======================================
    // VERIFICAR CÓDIGO (LÓGICA DE CRIAÇÃO FINAL)
    // =======================================
    static async verificarCodigo(req, res) {
        const { email, codigo } = req.body;
        if (!email || !codigo) {
            return res.status(400).json({ mensagem: 'Email e código são obrigatórios.' });
        }

        try {
            // 1. Validar e buscar os dados de registro pendentes
            // Nota: Assumimos que o CodigosModel.validarEConsumirRegistro(email, codigo) existe
            const registroPendente = await CodigosModel.validarEConsumirRegistro(email, codigo);

            if (registroPendente === 'EXPIRADO') {
                return res.status(400).json({ mensagem: 'O código de verificação expirou.' });
            }

            if (registroPendente === 'INVALIDO' || !registroPendente) {
                return res.status(401).json({ mensagem: 'Código inválido ou não encontrado.' });
            }

            // 2. CRIAÇÃO FINAL DO USUÁRIO (COMMIT)
            // Nota: Assumimos que o UsuariosModel.criarUsuarioComHash existe
            const novoUsuario = await UsuariosModel.criarUsuarioComHash({
                nome: registroPendente.nome,
                email: registroPendente.email,
                senha_hash: registroPendente.senha_hash,
                email_verificado: true
            });

            // 3. Gerar token de login
            const token = AuthModel.gerarToken(novoUsuario);

            console.log(`✅ Registro finalizado e email verificado: ${novoUsuario.email} (ID: ${novoUsuario.id})`);
            
            // Resposta: Sucesso na criação e login automático
            res.json({ 
                mensagem: 'Registro e verificação concluídos com sucesso!',
                token: token,
                usuario: { 
                    id: novoUsuario.id, 
                    nome: novoUsuario.nome, 
                    email: novoUsuario.email 
                } 
            });

        } catch (erro) {
            console.error('❌ Erro ao finalizar registro/verificar código:', erro);
            res.status(500).json({ mensagem: 'Erro ao finalizar o registro. Tente novamente.' });
        }
    }
}

export default UsuariosController;