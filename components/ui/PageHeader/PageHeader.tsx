interface PageHeaderProps {
	title: string
	subtitle?: string
	actions?: React.ReactNode
	className?: string
}

export default function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
	return (
		<div className={`flex items-center justify-between mb-6 ${className}`}>
			<div>
				<h1 className="text-black font-semibold text-3xl">{title}</h1>
				{subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
			</div>
			{actions}
		</div>
	)
}
