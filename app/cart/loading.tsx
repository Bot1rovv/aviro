export default function Loading() {
	return (
		<div className="container py-8 animate-pulse">
			<div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
					>
						<div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
						<div className="flex-1 space-y-2">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				))}
			</div>
			<div className="mt-8 h-12 bg-gray-200 rounded w-full"></div>
		</div>
	)
}
