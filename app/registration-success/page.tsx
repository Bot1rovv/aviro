'use client'

import { CheckCircle, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function RegistrationSuccessContent() {
	const searchParams = useSearchParams()
	const verified = searchParams.get('verified') === 'true'

	return (
		<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
			<div className="text-center max-w-md">
				{verified ? (
					<>
						<MailCheck className="w-20 h-20 text-green-500 mx-auto mb-6" />
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Email подтверждён!</h1>
						<p className="text-gray-600 mb-8">
							Ваш email успешно подтверждён. Теперь вы можете войти в систему и пользоваться всеми функциями аккаунта.
						</p>
						<Link
							href="/login"
							className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
						>
							Войти в аккаунт
						</Link>
					</>
				) : (
					<>
						<CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
						<h1 className="text-3xl font-bold text-gray-900 mb-4">Аккаунт успешно создан!</h1>
						<p className="text-gray-600 mb-8">
							Поздравляем! Ваш аккаунт был успешно зарегистрирован. На вашу почту отправлено письмо с подтверждением. Пожалуйста, проверьте вашу почту
							и перейдите по ссылке в письме, чтобы завершить регистрацию.
						</p>
						<div className="space-y-4">
							<Link
								href="/login"
								className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
							>
								Войти в аккаунт
							</Link>
							<p className="text-sm text-gray-500">
								Если вы не получили письмо, проверьте папку «Спам» или{' '}
								<button
									className="text-amber-600 underline hover:text-amber-700"
									onClick={() => alert('Функция повторной отправки пока не реализована')}
								>
									запросите повторную отправку
								</button>
								.
							</p>
						</div>
					</>
				)}
			</div>
		</div>
	)
}

export default function RegistrationSuccessPage() {
	return (
		<Suspense fallback={<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">Загрузка...</div>}>
			<RegistrationSuccessContent />
		</Suspense>
	)
}
