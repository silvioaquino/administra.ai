// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendResetPasswordEmail(email: string, resetUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: email,
    subject: 'Redefinição de senha - Empório do Sabor',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #de4838;">Redefinição de senha</h2>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #de4838; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Redefinir senha
        </a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">Empório do Sabor - Sistema de Gestão</p>
      </div>
    `
  })
}