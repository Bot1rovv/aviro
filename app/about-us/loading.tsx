import { LoadingSkeleton } from '@/components/ui'

export default function Loading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<LoadingSkeleton type="page" />
		</div>
	)
}
