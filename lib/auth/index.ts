import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import NextAuth, { type AuthOptions, type Session, type User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: AuthOptions = {
	debug: true,
	providers: [
		CredentialsProvider({
			name: 'credentials',
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
				name: { label: 'Name', type: 'text', optional: true }
			},
			async authorize(credentials) {
				const email = credentials?.email?.trim()
				const password = credentials?.password

				if (!email || !password) {
					return null
				}

				const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1)

				if (!existingUser) {
					throw new Error('Пользователь не найден')
				}

				if (!existingUser.password) {
					throw new Error('Учетная запись не настроена')
				}

				const isValid = await bcrypt.compare(password, existingUser.password)

				if (!isValid) {
					throw new Error('Неверный пароль')
				}

				// Проверяем подтверждён ли email
				if (!existingUser.emailVerified) {
					throw new Error('Email не подтверждён. Пожалуйста, проверьте вашу почту.')
				}

				// Проверяем что name не пустой и не "undefined"
				const userName = existingUser.name && existingUser.name !== 'undefined' ? existingUser.name : email.split('@')[0] || 'Пользователь'

				return {
					id: existingUser.id,
					email: existingUser.email,
					name: userName
				}
			}
		})
	],
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60
	},
	pages: {
		signIn: '/login',
		error: '/login'
	},
	callbacks: {
		async jwt({ token, user }: { token: JWT; user?: User }) {
			if (user) {
				token.id = user.id
				token.email = user.email
				token.name = user.name
			}
			return token
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			if (session.user) {
				session.user.id = token.id as string
				session.user.email = token.email as string
				// Проверяем что name не пустой и не "undefined"
				const userName = token.name && token.name !== 'undefined' ? token.name : token.email?.split('@')[0] || 'Пользователь'
				session.user.name = userName
			}
			return session
		}
	},
	secret: process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
