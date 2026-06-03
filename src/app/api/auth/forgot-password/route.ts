// src/app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { Resend } from 'resend'

// Inicializar Resend com sua API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { message: "E-mail é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe (usando email)
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Por segurança, mesmo se o usuário não existir, retornamos sucesso
    if (!user) {
      console.log(`Tentativa de reset para e-mail não cadastrado: ${email}`)
      return NextResponse.json(
        { message: "Se o e-mail estiver cadastrado, você receberá as instruções" },
        { status: 200 }
      )
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Construir URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
    
    // Log para desenvolvimento
    console.log("=== LINK DE REDEFINIÇÃO DE SENHA ===")
    console.log(`Email: ${email}`)
    console.log(`Token: ${resetToken}`)
    console.log(`Link: ${resetUrl}`)
    console.log("====================================")

    // Enviar e-mail usando Resend
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Empório do Sabor <onboarding@resend.dev>",
        to: email,
        subject: "Redefinição de senha - Empório do Sabor",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinição de Senha</title>
            <style>
              @media only screen and (max-width: 600px) {
                .container {
                  width: 100% !important;
                  padding: 20px !important;
                }
                .button {
                  display: block !important;
                  width: 100% !important;
                }
              }
            </style>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <!-- Logo e Cabeçalho -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #de4838 0%, #c73d2e 100%); border-radius: 16px; padding: 12px; margin-bottom: 16px;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9H21M7 3H17M12 3V9M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <path d="M9 13L12 16L19 9" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <h1 style="color: #1f2937; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Empório do Sabor</h1>
                <p style="color: #6b7280; font-size: 16px; margin: 0;">Redefinição de senha</p>
              </div>

              <!-- Card Principal -->
              <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Olá <strong style="color: #de4838;">${user.name || 'usuário'}</strong>,
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                  Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Empório do Sabor</strong>. 
                  Clique no botão abaixo para criar uma nova senha:
                </p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" 
                     class="button"
                     style="background: linear-gradient(135deg, #de4838 0%, #c73d2e 100%); 
                            color: white; 
                            padding: 14px 32px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: 600; 
                            font-size: 16px;
                            display: inline-block;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                    Redefinir minha senha
                  </a>
                </div>

                <div style="background-color: #fef2f2; border-left: 4px solid #de4838; padding: 16px; border-radius: 8px; margin: 24px 0;">
                  <p style="color: #7f1d1d; font-size: 14px; margin: 0;">
                    ⏰ Este link é válido por <strong>1 hora</strong> a partir do envio deste e-mail.
                  </p>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 8px;">
                  Se você não solicitou essa alteração, pode ignorar este e-mail com segurança. Sua senha atual continuará funcionando normalmente.
                </p>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                </p>
                <p style="color: #9ca3af; font-size: 12px; background-color: #f9fafb; padding: 12px; border-radius: 6px; word-break: break-all; margin: 8px 0 0 0;">
                  ${resetUrl}
                </p>
              </div>

              <!-- Rodapé -->
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
                  Empório do Sabor - Sistema de Gestão para Restaurantes
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  Este e-mail foi enviado automaticamente, por favor não responda.
                </p>
                <p style="color: #d1d5db; font-size: 11px; margin-top: 16px;">
                  © ${new Date().getFullYear()} Empório do Sabor. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      })

      if (error) {
        console.error("Erro ao enviar e-mail com Resend:", error)
        // Não vamos falhar a requisição mesmo se o e-mail falhar
        // Apenas logamos o erro
      } else {
        console.log("E-mail enviado com sucesso:", data?.id)
      }
    } catch (emailError) {
      console.error("Exceção ao enviar e-mail:", emailError)
      // Não falhamos a requisição
    }

    return NextResponse.json(
      { 
        message: "Se o e-mail estiver cadastrado, você receberá as instruções",
        // Apenas para desenvolvimento - remover em produção!
        ...(process.env.NODE_ENV === 'development' && { devLink: resetUrl })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro no forgot-password:", error)
    return NextResponse.json(
      { message: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    )
  }
}