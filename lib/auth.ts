import { AuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import { compare } from "bcrypt"
import { JWT } from "next-auth/jwt"
import type { DefaultSession } from "next-auth"

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"]
  }
}

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("認証情報が不足しています");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          console.log("ユーザーが見つかりません:", credentials.email);
          return null;
        }

        const isValid = await compare(credentials.password, user.passwordHash);
        if (!isValid) {
          console.log("パスワードが無効です:", credentials.email);
          return null;
        }

        // 返却するユーザー情報
        const returnUser = {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role // ユーザーモデルに直接roleフィールドがある
        };

        console.log('認証されたユーザー:', returnUser);
        return returnUser;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback input:', { token, user });

      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.role = customUser.role;
        console.log('トークンに初期ロールを設定:', customUser.role);
      }

      // tokenにroleがない場合はDBから取得
      if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { 
            email: token.email
          }
        });

        if (dbUser) {
          token.role = dbUser.role;
          console.log('DBからロールを取得:', dbUser.role);
        } else {
          console.warn('ユーザーにロールが見つかりません:', token.email);
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log('Session Callback input:', { session, token });

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        console.log('セッションにロールを設定:', token.role);
      }

      return session;
    }
  }
} 