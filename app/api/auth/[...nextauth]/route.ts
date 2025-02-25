import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcrypt"

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("認証エラー: 認証情報が不足しています")
          return null
        }

        try {
          console.log("認証開始:", credentials.email)

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              passwordHash: true
            }
          })

          console.log("ユーザー検索結果:", user ? "見つかりました" : "見つかりません")

          if (!user || !user.passwordHash) {
            console.error("認証エラー: ユーザーが見つからないか、パスワードが設定されていません")
            return null
          }

          const isValid = await compare(credentials.password, user.passwordHash)
          console.log("パスワード検証:", isValid ? "成功" : "失敗")

          if (!isValid) {
            console.error("認証エラー: パスワードが一致しません")
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error("認証エラー:", error)
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
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24時間
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true // 開発環境でデバッグモードを有効化
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

