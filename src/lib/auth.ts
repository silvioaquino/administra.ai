// src/lib/auth.ts - Versão para teste (desabilita banco)
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// USUÁRIO FIXO PARA TESTE
const TEST_USER = {
  id: "1",
  email: "teste@teste.com",
  name: "Usuário Teste",
  password: "123456" // Senha: 123456
}

export const authOptions: NextAuthOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        
        // VALIDAÇÃO SIMPLES PARA TESTE
        if (credentials.email === TEST_USER.email && 
            credentials.password === TEST_USER.password) {
          return {
            id: TEST_USER.id,
            email: TEST_USER.email,
            name: TEST_USER.name,
          }
        }
        
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}