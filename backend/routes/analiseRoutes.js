import express from 'express';
import { requerAutenticacao } from '../middleware/auth.js';
import AnaliseController from '../controllers/AnaliseController.js';

const roteador = express.Router();

/**
 * @route POST /
 * @description Analisa uma refeição a partir de uma imagem em Base64.
 * @access Privado (requer autenticação)
 */
// CORREÇÃO: Altere '/analisar' para '/'
roteador.post('/', requerAutenticacao, AnaliseController.analisarRefeicao);

export default roteador;