import { getTaobaoThemeList, getTaobaoThemeDetail } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const themeId = searchParams.get('themeId')
	const themeType = searchParams.get('themeType')
	const page = searchParams.get('page')
	const pageSize = searchParams.get('pageSize')

	try {
		let response
		if (themeId) {
			// Получить детали конкретной темы
			const params: Record<string, string | number | boolean> = {}
			if (page) params.page_no = parseInt(page, 10)
			if (pageSize) params.page_size = parseInt(pageSize, 10)
			response = await getTaobaoThemeDetail(themeId, params)
		} else {
			// Получить список тем
			const params: Record<string, string | number | boolean> = {}
			if (themeType) params.themeType = themeType
			response = await getTaobaoThemeList(params)
		}

		return NextResponse.json({
			success: true,
			data: response,
			timestamp: new Date().toISOString()
		})
	} catch (error: unknown) {
		console.error('Taobao themes API error:', error)
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
