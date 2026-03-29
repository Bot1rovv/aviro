import { getPoizonProductDetail, getPoizonProducts } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const keyword = searchParams.get('keyword')
	const chineseKeyword = searchParams.get('chineseKeyword')
	const brand = searchParams.get('brand')
	const pageSize = searchParams.get('pageSize')
	const startId = searchParams.get('startId')
	const dwSpuId = searchParams.get('dwSpuId')
	const dwDesignerId = searchParams.get('dwDesignerId')

	try {
		let response

		if (dwSpuId) {
			// Получить детали товара
			response = await getPoizonProductDetail(dwSpuId, dwDesignerId || undefined)
		} else if (keyword || chineseKeyword || brand) {
			// Поиск товаров
			const params: Record<string, string | number | boolean> = {
				startId: startId || '1',
				pageSize: pageSize || '10'
			}

			response = await getPoizonProducts(keyword || undefined, chineseKeyword || undefined, brand || undefined, params)
		} else {
			return NextResponse.json(
				{
					success: false,
					error: 'Provide keyword, chineseKeyword, brand, or dwSpuId'
				},
				{ status: 400 }
			)
		}

		return NextResponse.json({
			success: true,
			data: response,
			timestamp: new Date().toISOString()
		})
	} catch (error: unknown) {
		console.error('Poizon API error:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const errorDetails = error instanceof Error ? error.toString() : String(error)
		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
				details: errorDetails
			},
			{ status: 500 }
		)
	}
}
