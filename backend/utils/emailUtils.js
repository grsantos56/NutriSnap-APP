import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configuração do Transportador
// OBS: Use um email profissional (ex: SendGrid, Mailgun) em produção. 
// O Gmail exige "Senhas de App" específicas.
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com', // Exemplo: host do seu provedor
    port: process.env.EMAIL_PORT || 465, // Exemplo: porta TLS/SSL
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.EMAIL_USER, // Seu email (do .env)
        pass: process.env.EMAIL_PASS, // Sua senha/App Password (do .env)
    },
});

/**
 * Envia o código de verificação para o email do usuário.
 * @param {string} destinatario - Email para onde o código será enviado.
 * @param {string} codigo - O código de 6 dígitos.
 */
export async function enviarEmailCodigo(destinatario, codigo) {
    try {
        await transporter.sendMail({
            from: `"NutriSnap - Verificação" <${process.env.EMAIL_USER}>`,
            to: destinatario,
            subject: "Seu Código de Verificação NutriSnap",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #00C9FF;">Verificação de Email</h2>
                    <p>Olá,</p>
                    <p>Use o código abaixo para verificar seu email:</p>
                    
                    <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #00C9FF; margin: 0; font-size: 32px;">${codigo}</h1>
                    </div>
                    
                    <p>Este código é válido por **15 minutos**.</p>
                    <p style="margin-top: 30px; font-size: 12px; color: #777;">Atenciosamente, <br> Equipe NutriSnap</p>
                </div>
            `,
        });
        console.log(`✉️ E-mail de código enviado para ${destinatario}`);
    } catch (error) {
        console.error('❌ Erro no Nodemailer ao enviar email:', error);
        // Opcional: Relançar um erro mais limpo ou apenas logar
        throw new Error('Falha ao enviar e-mail de verificação. Verifique as credenciais SMTP.');
    }
}