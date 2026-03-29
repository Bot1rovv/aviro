'use client'

import StepOne from '@/app/cart/StepOne'
import StepThree from '@/app/cart/StepThree'
import StepTwo from '@/app/cart/StepTwo'
import { Button } from '@/components/ui'
import { CartItem } from '@/types/cart'
import { UserInfo } from '@/types/yandex-pay'
import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

type CartStep = 'cart' | 'checkout' | 'payment' | 'completed'

const steps = [
	{ id: 'cart' as CartStep, label: 'Корзина' },
	{ id: 'checkout' as CartStep, label: 'Оформить покупку' },
	{ id: 'payment' as CartStep, label: 'Оплата' },
	{ id: 'completed' as CartStep, label: 'Завершено' }
]

export default function CartStepper() {
	const [currentStep, setCurrentStep] = useState<CartStep>('cart')
	const [orderData, setOrderData] = useState<{
		items: CartItem[]
		userInfo: UserInfo
	} | null>(null)

	const currentStepIndex = steps.findIndex(step => step.id === currentStep)

	const goToNextStep = () => {
		if (currentStepIndex < steps.length - 1) {
			setCurrentStep(steps[currentStepIndex + 1].id)
		}
	}

	const goToPreviousStep = () => {
		if (currentStepIndex > 0) {
			setCurrentStep(steps[currentStepIndex - 1].id)
		}
	}

	const goToStep = (stepId: CartStep) => {
		setCurrentStep(stepId)
	}

	const handleStepTwoSubmit = (data: { items: CartItem[]; userInfo: UserInfo }) => {
		setOrderData(data)
		goToNextStep()
	}

	return (
		<div className="w-full">
			<div className="flex flex-col items-start gap-2.5 w-full mb-5">
				{steps.map((step, index) => {
					const isActive = step.id === currentStep
					const isCompleted = index < currentStepIndex
					const isFuture = index > currentStepIndex

					return (
						<button
							key={step.id}
							onClick={() => goToStep(step.id)}
							className={`
								uppercase font-medium text-2xl p-2.5 text-center w-full rounded-lg transition-all duration-300
								${
									isActive
										? 'bg-blue-800 bg-gradient-to-t from-[#0d65df] from-0% to-[#0752c2] to-100% text-white cursor-pointer'
										: isCompleted
											? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
											: 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed'
								}
							`}
							disabled={isFuture}
						>
							<span>{step.label}</span>
						</button>
					)
				})}
			</div>

			<div className="min-h-[400px]">
				{currentStep === 'cart' && <StepOne onNext={goToNextStep} />}
				{currentStep === 'checkout' && (
					<StepTwo
						onNext={handleStepTwoSubmit}
						onBack={goToPreviousStep}
					/>
				)}
				{currentStep === 'payment' && (
					<StepThree
						onNext={goToNextStep}
						onBack={goToPreviousStep}
						orderData={orderData ?? undefined}
					/>
				)}
				{currentStep === 'completed' && <CompletedStep />}
			</div>
		</div>
	)
}

function CompletedStep() {
	return (
		<div className="flex flex-col items-center justify-center py-20 bg-green-50 rounded-lg">
			<div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
				<ChevronRight
					className="text-white rotate-[-45deg]"
					size={40}
				/>
			</div>
			<h2 className="text-2xl font-bold text-green-700 mb-2 text-center">Заказ успешно оформлен!</h2>
			<p className="text-gray-600 mb-6 text-center">Спасибо за покупку. Мы свяжемся с вами в ближайшее время.</p>
			<Button
				variant="primary"
				onClick={() => (window.location.href = '/')}
			>
				Вернуться на главную
			</Button>
		</div>
	)
}