'use client'

interface Step {
	id: string
	label: string
}

interface StepsProps {
	steps: Step[]
	currentStep: string
	onStepClick?: (stepId: string) => void
	className?: string
}

export default function Steps({ steps, currentStep, onStepClick, className = '' }: StepsProps) {
	const currentStepIndex = steps.findIndex(step => step.id === currentStep)

	return (
		<div className={`flex flex-col items-start gap-2.5 w-full ${className}`}>
			{steps.map((step, index) => {
				const isActive = step.id === currentStep
				const isCompleted = index < currentStepIndex
				const isFuture = index > currentStepIndex

				return (
					<button
						key={step.id}
						onClick={() => !isFuture && onStepClick?.(step.id)}
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
	)
}
