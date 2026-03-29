export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
			<div className="animate-pulse text-center">
				<div className="h-8 w-40 bg-gray-200 rounded mx-auto mb-4"></div>
				<div className="h-4 w-56 bg-gray-200 rounded mx-auto"></div>
			</div>
		</div>
	)
}
