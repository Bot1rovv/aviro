import AuthFormWrapper from '@/components/AuthForm/AuthFormWrapper'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Регистрация',
	description: 'Регистрация на сайте Arivoo'
}

export default function RegistrationPage() {
	return (
		<div className="container">
			<AuthFormWrapper mode="registration" />
		</div>
	)
}
