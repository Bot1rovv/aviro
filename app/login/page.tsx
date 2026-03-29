import AuthFormWrapper from '@/components/AuthForm/AuthFormWrapper'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Логин',
	description: 'Авторизация на сайте Arivoo'
}

export default function LoginPage() {
	return (
		<div className="container">
			<AuthFormWrapper mode="login" />
		</div>
	)
}
