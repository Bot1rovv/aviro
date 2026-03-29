import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function UserRedirectPage() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.id) {
		// Если пользователь не авторизован, перенаправляем на страницу входа
		redirect('/login')
	}

	// Перенаправляем на страницу профиля с ID пользователя
	redirect(`/user/${session.user.id}`)
}
