// scripts/create-admin.ts
// Cria (ou promove) um usuário administrador do SaaS.
// Uso: npx tsx scripts/create-admin.ts <email> [senha]
//   - Se o e-mail não existir: cria o User + Empresa com role ADMIN.
//   - Se já existir: apenas promove para ADMIN.

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()
const email = process.argv[2]
const senha = process.argv[3] || "Admin@2026!"

async function main() {
  if (!email) {
    console.error("Uso: npx tsx scripts/create-admin.ts <email> [senha]")
    process.exit(1)
  }

  const existente = await db.user.findUnique({ where: { email } })

  if (existente) {
    const atualizado = await db.user.update({
      where: { email },
      data: { role: "ADMIN" },
    })
    console.log(`Usuário ${atualizado.email} promovido a ADMIN.`)
    return
  }

  const passwordHash = await bcrypt.hash(senha, 10)
  const trialEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)

  const user = await db.user.create({
    data: {
      email,
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
      trialEndsAt,
      empresas: {
        create: {
          nome: "Administração SaaS",
          segmento: "SaaS",
        },
      },
    },
  })

  console.log(`Admin criado: ${user.email} (role=${user.role})`)
  console.log(`Senha temporária: ${senha}`)
  console.log("Recomendação: altere a senha após o primeiro acesso.")
}

main()
  .catch((e) => {
    console.error("Erro ao criar admin:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
