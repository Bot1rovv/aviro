import { getCategories1688, getPoizonCategories, getTaobaoThemeList } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const parentId = searchParams.get('parentId') || undefined
	const parentCategoryId = searchParams.get('parentCategoryId') || undefined
	const themeType = searchParams.get('themeType') || undefined
	const language = searchParams.get('language') || 'ru'

	try {
		// Собираем параметры, исключая undefined
		const params1688: Record<string, string | number | boolean> = {}
		if (parentCategoryId) params1688.parentCategoryId = parentCategoryId
		else params1688.parentCategoryId = '0'

		const paramsTaobao: Record<string, string | number | boolean> = {}
		if (themeType) paramsTaobao.themeType = themeType
		paramsTaobao.language = language

		const paramsPoizon: Record<string, string | number | boolean> = {}
		if (parentId) paramsPoizon.parentId = parentId
		else paramsPoizon.parentId = '0'

		// Параллельно запрашиваем категории из всех источников
		const [categories1688, taobaoThemes, poizonCategories] = await Promise.allSettled([
			getCategories1688(params1688),
			getTaobaoThemeList(paramsTaobao),
			getPoizonCategories(paramsPoizon)
		])

		const result = {
			sources: {
				'1688': categories1688.status === 'fulfilled' ? categories1688.value : { error: categories1688.reason?.message || 'Unknown error' },
				taobao: taobaoThemes.status === 'fulfilled' ? taobaoThemes.value : { error: taobaoThemes.reason?.message || 'Unknown error' },
				poizon: poizonCategories.status === 'fulfilled' ? poizonCategories.value : { error: poizonCategories.reason?.message || 'Unknown error' }
			},
			metadata: {
				parentId,
				parentCategoryId,
				themeType,
				language,
				timestamp: new Date().toISOString()
			}
		}

		return NextResponse.json({
			success: true,
			data: result
		})
	} catch (error: unknown) {
		console.error('Categories aggregation API error:', error)
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
