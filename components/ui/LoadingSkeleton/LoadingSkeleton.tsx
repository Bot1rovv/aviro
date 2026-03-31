interface LoadingSkeletonProps {
	type?: 'product' | 'page' | 'card'
	className?: string
}

export default function LoadingSkeleton({
	type = 'product',
	className = ''
}: LoadingSkeletonProps) {
	if (type === 'page') {
		return (
			<div className={`animate-pulse ${className}`}>
				<div className="mb-6 h-8 w-40 rounded bg-gray-200" />

				<div className="grid grid-cols-1 gap-8 md:grid-cols-2">
					<div className="aspect-square rounded-2xl bg-gray-200" />

					<div className="space-y-4">
						<div className="h-8 w-3/4 rounded bg-gray-200" />
						<div className="h-6 w-1/3 rounded bg-gray-200" />
						<div className="h-12 w-1/2 rounded bg-gray-200" />
						<div className="h-24 rounded-xl bg-gray-200" />
						<div className="h-24 rounded-xl bg-gray-200" />
						<div className="h-14 w-full rounded-xl bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	if (type === 'card') {
		return (
			<div className={`animate-pulse overflow-hidden rounded-xl border border-gray-100 bg-white ${className}`}>
				<div className="aspect-square bg-gray-200" />
				<div className="space-y-3 p-3">
					<div className="h-4 w-full rounded bg-gray-200" />
					<div className="h-4 w-2/3 rounded bg-gray-200" />
					<div className="flex items-center justify-between pt-2">
						<div className="h-5 w-20 rounded bg-gray-200" />
						<div className="h-9 w-9 rounded-full bg-gray-200" />
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className={`animate-pulse ${className}`}>
			<div className="mb-6 h-8 w-48 rounded bg-gray-200" />

			<div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 2xl:grid-cols-6">
				{Array.from({ length: 12 }).map((_, i) => (
					<div
						key={i}
						className="overflow-hidden rounded-xl border border-gray-100 bg-white"
					>
						<div className="aspect-square bg-gray-200" />
						<div className="space-y-3 p-3">
							<div className="h-4 w-full rounded bg-gray-200" />
							<div className="h-4 w-3/4 rounded bg-gray-200" />
							<div className="flex items-center justify-between pt-2">
								<div className="h-5 w-20 rounded bg-gray-200" />
								<div className="h-9 w-9 rounded-full bg-gray-200" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}