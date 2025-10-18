import express from 'express';
import AuthController from '../controllers/AuthController.js';
import UsuariosController from '../controllers/UsuariosController.js'; // NOVO: Para os métodos de código

const roteador = express.Router();

/**
 * @route POST /registrar
 * @description Registra um novo usuário.
 */
roteador.post('/registrar', AuthController.registrar);

/**
 * @route POST /entrar
 * @description Realiza o login do usuário e gera um token JWT.
 */
roteador.post('/entrar', AuthController.entrar);

// =======================================
// NOVAS ROTAS DE VERIFICAÇÃO DE EMAIL
// =======================================

/**
 * @route POST /enviar-codigo
 * @description Envia um código de verificação para o email fornecido.
 */
roteador.post('/enviar-codigo', UsuariosController.enviarCodigoVerificacao);

/**
 * @route POST /verificar-codigo
 * @description Valida o código recebido pelo usuário.
 */
roteador.post('/verificar-codigo', UsuariosController.verificarCodigo);

// =======================================

/**
 * @route GET /verificar
 * @description Verifica se um token JWT é válido.
 */
roteador.get('/verificar', AuthController.verificar);

export default roteador;