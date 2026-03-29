interface LoadingSkeletonProps {
	type?: 'product' | 'page' | 'card'
	className?: string
}

export default function LoadingSkeleton({ type = 'product', className = '' }: LoadingSkeletonProps) {
	if (type === 'page') {
		return (
			<div className="animate-pulse">
				<div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					<div className="aspect-square bg-gray-200 rounded-lg"></div>
					<div className="space-y-4">
						<div className="h-8 bg-gray-200 rounded w-3/4"></div>
						<div className="h-6 bg-gray-200 rounded w-1/4"></div>
						<div className="h-20 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		)
	}

	if (type === 'card') {
		return (
			<div className={`animate-pulse ${className}`}>
				<div className="bg-gray-200 rounded-lg aspect-square mb-4"></div>
				<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
				<div className="h-4 bg-gray-200 rounded w-1/2"></div>
			</div>
		)
	}

	// Default product card grid
	return (
		<div className="animate-pulse">
			<div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
				{Array.from({ length: 8 }).map((_, i) => (
					<div key={i} className="bg-gray-200 rounded-lg aspect-square"></div>
				))}
			</div>
		</div>
	)
}
