import UsuariosModel from '../models/usuarios.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

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
    // LOGIN VIA GOOGLE
    // =======================================
    static async loginGoogle(req, res) {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ mensagem: 'idToken é obrigatório' });

        try {
            // 1️⃣ Validar token no Google
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
            const googleUser = await googleRes.json();

            if (googleUser.error_description) {
                return res.status(401).json({ mensagem: 'Token Google inválido' });
            }

            // 2️⃣ Verificar se o usuário já existe
            let usuario = await UsuariosModel.buscarPorEmail(googleUser.email);

            if (!usuario) {
                // 3️⃣ Criar usuário novo
                const id = await UsuariosModel.criarUsuarioGoogle({
                    nome: googleUser.name,
                    email: googleUser.email,
                    foto: googleUser.picture
                });
                usuario = { id, nome: googleUser.name, email: googleUser.email, foto: googleUser.picture };
            }

            // 4️⃣ Gerar JWT
            const token = jwt.sign({ idUsuario: usuario.id }, process.env.JWT_SECRET, {
                expiresIn: '7d',
            });

            res.json({ usuario, token });

        } catch (erro) {
            console.error('❌ Erro no login Google:', erro);
            res.status(500).json({ mensagem: 'Erro ao autenticar com Google', erro: erro.message });
        }
    }
}

export default UsuariosController;
