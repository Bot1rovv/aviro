'use client'

import { useUserStore } from '@/lib/store'
import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import { ReactNode, useEffect, useRef } from 'react'

interface Props {
	children: ReactNode
}

export default function SessionProvider({ children }: Props) {
	return (
		<NextAuthSessionProvider>
			<SessionSync>{children}</SessionSync>
		</NextAuthSessionProvider>
	)
}

function SessionSync({ children }: { children: ReactNode }) {
	const { data: session, status } = useSession()
	const setUser = useUserStore(state => state.setUser)
	const logout = useUserStore(state => state.logout)
	const isInitialized = useRef(false)

	// Синхронизация сессии NextAuth с Zustand
	useEffect(() => {
		// Пропускаем первую загрузку
		if (status === 'loading') return

		// Выполняем синхронизацию только один раз после загрузки
		if (!isInitialized.current) {
			isInitialized.current = true
		}

		if (session?.user) {
			// Сессия есть — обновляем store

			setUser({
				id: session.user.id || '',
				email: session.user.email || '',
				name: session.user.name || ''
			})
		} else if (status === 'unauthenticated' && isInitialized.current) {
			// Сессия отсутствует после инициализации — очищаем store

			logout()
		}
	}, [session, status, setUser, logout])

	return <>{children}</>
}
