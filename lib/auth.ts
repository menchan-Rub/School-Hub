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
          where: { email: credentials.email },
          include: { role: true }
        });

        if (!user || !user.role) {
          console.log("User or role not found:", credentials.email);
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          console.log("Invalid password for:", credentials.email);
          return null;
        }

        // 返却するユーザー情報にroleを含める
        const returnUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name // ここでロール名を設定
        };

        console.log('Authorized user:', returnUser);
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
        console.log('Setting initial role in token:', customUser.role);
      }

      // tokenにroleがない場合はDBから取得
      if (!token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { 
            email: token.email as string  // nullを除外
          },
          include: { role: true }
        });

        if (dbUser?.role) {
          token.role = dbUser.role.name;
          console.log('Retrieved role from DB:', dbUser.role.name);
        } else {
          console.warn('No role found for user:', token.email);
        }
      }

      return token;
    },

    async session({ session, token }) {
      console.log('Session Callback input:', { session, token });

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        console.log('Setting role in session:', token.role);
      }

      return session;
    }
  }
} 