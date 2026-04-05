import { loadProductsPage } from '@/lib/server/actions'
import { HomeClient } from './HomeClient'

export default async function Home() {
	const initialResult = await loadProductsPage(1)
	const initialProducts = initialResult.success ? initialResult.data : []

	return (
		<div className="container mx-auto px-4 py-8">
			<HomeClient initialProducts={initialProducts} />
		</div>
	)
}