import { API_CONFIG, ENDPOINTS } from '@/config/api.config'
import { dajiFetch, searchProductsByKeyword } from '@/lib/api-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const keyword = searchParams.get('keyword') || 'test'
	const action = searchParams.get('action')

	// Если запрошены категории
	if (action === 'categories') {
		try {
			const result = await dajiFetch(ENDPOINTS.CATEGORY_QUERY, {
				method: 'GET',
				params: {}
			})
			return NextResponse.json({
				success: true,
				data: result
			})
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return NextResponse.json({ success: false, error: message }, { status: 500 })
		}
	}

	try {
		// Для отладки: вызовем searchProductsByKeyword, но также вернём дополнительные данные
		const result = await searchProductsByKeyword(keyword)
		return NextResponse.json({
			success: true,
			data: result,
			debug: {
				keyword,
				timestamp: Date.now(),
				accessKey: API_CONFIG.ACCESS_KEY,
				accessSecret: API_CONFIG.ACCESS_SECRET ? '***' : 'empty'
			}
		})
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Unknown error'
		const stack = error instanceof Error ? error.stack : undefined
		return NextResponse.json({ success: false, error: message, stack }, { status: 500 })
	}
}
