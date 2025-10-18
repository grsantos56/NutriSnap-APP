import express from 'express';
import { requerAutenticacao } from '../middleware/auth.js';
import UsuariosController from '../controllers/usuariosController.js';

const roteador = express.Router();

/**
 * @route GET /perfil
 * @description Retorna os dados do perfil do usuário.
 */
roteador.get('/perfil', requerAutenticacao, UsuariosController.buscarPerfil);

/**
 * @route PUT /perfil
 * @description Atualiza os dados do perfil do usuário.
 */
roteador.put('/perfil', requerAutenticacao, UsuariosController.atualizarPerfil);

/**
 * @route PUT /alterar-senha
 * @description Altera a senha do usuário.
 */
roteador.put('/alterar-senha', requerAutenticacao, UsuariosController.alterarSenha);



export default roteador;
