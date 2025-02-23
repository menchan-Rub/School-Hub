import { AuthOptions, DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

// 型定義の拡張
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
  interface User {
    role: string
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    error: "/login"  // エラーページも指定
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: "user"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // 開発環境での簡易認証
          if (process.env.NODE_ENV === "development") {
            if (credentials?.email === "admin@school-hub.com" && 
                credentials?.password === "admin123") {
              return {
                id: "admin-id",
                name: "システム管理者",
                email: "admin@school-hub.com",
                role: "super_admin",
                image: null
              }
            }
          }
          return null
        } catch (error) {
          console.error('Auth Error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // 内部URLの場合はそのまま
      if (url.startsWith(baseUrl)) {
        return url
      }
      // 外部URLの場合はbaseUrlにリダイレクト
      return baseUrl
    }
  }
}
