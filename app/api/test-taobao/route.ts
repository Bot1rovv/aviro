import { API_CONFIG } from '@/config/api.config'
import { searchTaobaoProductsByKeyword } from '@/lib/api-client'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const keyword = searchParams.get('keyword') || 'phone'
	const page = searchParams.get('page') || '1'
	const pageNo = parseInt(page, 10)

	try {
		const result = await searchTaobaoProductsByKeyword(keyword, { page_no: pageNo })

		return NextResponse.json({
			success: true,
			data: result,
			debug: {
				keyword,
				pageNo,
				timestamp: Date.now(),
				accessKey: API_CONFIG.ACCESS_KEY,
				accessSecret: API_CONFIG.ACCESS_SECRET ? '***' : 'empty'
			}
		})
	} catch (error: unknown) {
		console.error('[/api/test-taobao] Error:', error)
		const message = error instanceof Error ? error.message : 'Unknown error'
		const stack = error instanceof Error ? error.stack : undefined
		return NextResponse.json(
			{
				success: false,
				error: message,
				stack,
				debug: {
					keyword,
					pageNo,
					accessKey: API_CONFIG.ACCESS_KEY,
					timestamp: Date.now()
				}
			},
			{ status: 500 }
		)
	}
}
