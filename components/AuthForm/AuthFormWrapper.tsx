'use client'

import AuthForm from './AuthForm'
import { Suspense } from 'react'

interface Props {
	mode: 'login' | 'registration'
}

function AuthFormWithParams({ mode }: Props) {
	return <AuthForm mode={mode} />
}

export default function AuthFormWrapper({ mode }: Props) {
	return (
		<Suspense fallback={<div>Загрузка...</div>}>
			<AuthFormWithParams mode={mode} />
		</Suspense>
	)
}
