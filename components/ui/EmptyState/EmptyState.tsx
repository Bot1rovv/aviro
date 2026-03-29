import { LucideIcon } from 'lucide-react'
import Button from '../Button/Button'

interface EmptyStateProps {
	icon?: LucideIcon
	title: string
	description?: string
	action?: {
		label: string
		onClick: () => void
	}
	className?: string
}

export default function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
	return (
		<div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
			{Icon && (
				<Icon
					size={48}
					className="mb-4 text-gray-400"
				/>
			)}
			<p className="text-gray-500 text-lg mb-2">{title}</p>
			{description && <p className="text-gray-400 text-sm mb-4">{description}</p>}
			{action && (
				<Button
					variant="primary"
					onClick={action.onClick}
				>
					{action.label}
				</Button>
			)}
		</div>
	)
}
