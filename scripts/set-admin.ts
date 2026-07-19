// scripts/set-admin.ts
// Promove um usuário a ADMIN pelo e-mail.
// Uso: npx tsx scripts/set-admin.ts email@exemplo.com

import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()
const email = process.argv[2]

async function main() {
  if (!email) {
    console.error("Uso: npx tsx scripts/set-admin.ts email@exemplo.com")
    process.exit(1)
  }

  const user = await db.user.update({
    where: { email },
    data: { role: "ADMIN" },
  })

  console.log(`Admin definido com sucesso: ${user.email}`)
}

main()
  .catch((e) => {
    console.error("Erro ao definir admin:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
