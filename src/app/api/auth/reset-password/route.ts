// src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Buscar usuário pelo token (usando o campo resetToken)
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // Token não expirado
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: "Link inválido ou expirado. Solicite uma nova redefinição." },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha e limpar tokens (usando passwordHash)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    })

    return NextResponse.json(
      { message: "Senha redefinida com sucesso! Agora você pode fazer login." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erro no reset-password:", error)
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}