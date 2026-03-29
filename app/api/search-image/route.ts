import { fileToBase64, searchProductsByImageId1688, searchTaobaoProductsByImageId, uploadImage1688, uploadImageTaobao } from '@/lib/api-client'
import { createSession, getSession, updateSession } from '@/lib/session-store-db'
import { cnyToRub } from '@/lib/utils/format'
import type { ProductItem } from '@/types/product'
import type { SearchSource } from '@/types/search'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const image = formData.get('image') as File | null
		const _source = (formData.get('source') as SearchSource) || '1688'
		const page = parseInt((formData.get('page') as string) || '1', 10)
		const sessionId = formData.get('sessionId') as string | null

		// Если передан sessionId, пытаемся получить сессию и использовать imageIds
		if (sessionId) {
			const session = await getSession(sessionId)
			if (!session) {
				return NextResponse.json({ success: false, error: 'Сессия истекла или не найдена' }, { status: 400 })
			}
			const { imageIds, sources, pageSize, totalPages } = session
			if (!imageIds || !sources) {
				return NextResponse.json({ success: false, error: 'Неверная сессия' }, { status: 400 })
			}

			const products: ProductItem[] = []
			let hasMore = false

			// Определяем, нужно ли включать Taobao (только первая страница)
			const includeTaobao = page === 1 && sources.includes('taobao')
			// Всегда включаем 1688, если источник есть
			const include1688 = sources.includes('1688')

			if (includeTaobao && imageIds.taobao) {
				const searchResult = await searchTaobaoProductsByImageId(imageIds.taobao, 'en', {
					page_no: 1,
					page_size: pageSize
				})
				if (searchResult && typeof searchResult === 'object') {
					const obj = searchResult as Record<string, unknown>
					if (obj.code === 200 && obj.data) {
						const data = obj.data as Record<string, unknown>
						const items = Array.isArray(data.data) ? data.data : []
						products.push(
							...items.map((item: Record<string, unknown>) => {
								const ml = item.multiLanguageInfo as { title?: string; language?: string } | Array<{ title?: string; language?: string }> | undefined
								let title = String(item.title || '')
								if (ml) {
									if (Array.isArray(ml)) {
										const ru = ml.find((m: { language?: string }) => m.language === 'ru')
										if (ru?.title) title = ru.title
										else if (ml[0]?.title) title = String(ml[0].title)
									} else if (ml.title) title = String(ml.title)
								}
								const priceCny = parseFloat(String(item.price || 0)) || 0
								return {
									productId: `taobao_${item.itemId}` || `img_search_${Date.now()}_${Math.random()}`,
									title,
									price: cnyToRub(priceCny).toFixed(2),
									imageUrl: String(item.mainImageUrl || item.pictUrl || ''),
									shopName: String(item.shopName || ''),
									sales: Number(item.sales) || 0,
									source: 'taobao' as const
								}
							})
						)
					}
				}
			}

			if (include1688 && imageIds['1688']) {
				const searchResult = await searchProductsByImageId1688(imageIds['1688'], {
					beginPage: page,
					pageSize,
					country: 'ru'
				})
				if (searchResult && typeof searchResult === 'object') {
					const obj = searchResult as Record<string, unknown>
					if (obj.code === 200 && obj.data) {
						const data = obj.data as Record<string, unknown>
						// Определяем totalPages из ответа, если есть
						let currentTotalPages = totalPages
						if (typeof data.totalPage === 'number') {
							currentTotalPages = data.totalPage
						}
						const items = Array.isArray(data.data) ? data.data : []
						products.push(
							...items.map((item: Record<string, unknown>) => {
								let priceStr = '0'
								if (typeof item.priceInfo === 'object') {
									priceStr = String(
										(item.priceInfo as Record<string, unknown>).price || (item.priceInfo as Record<string, unknown>).consignPrice || '0'
									)
								}
								const priceCny = parseFloat(priceStr) || 0
								return {
									productId: `1688_${item.offerId}` || `img_search_${Date.now()}_${Math.random()}`,
									title: String(item.subjectTrans || item.subject || ''),
									price: cnyToRub(priceCny).toFixed(2),
									imageUrl: String(item.imageUrl || item.whiteImage || ''),
									shopName: String(item.companyName || ''),
									sales: Number(item.monthSold) || 0,
									source: '1688' as const
								}
							})
						)

						// Определяем hasMore
						if (currentTotalPages !== undefined) {
							hasMore = page < currentTotalPages
						} else {
							// Эвристика: если количество результатов равно pageSize, возможно есть еще страницы
							hasMore = items.length >= pageSize
						}
					}
				}
			}

			// Обновляем сессию с новыми результатами
			await updateSession(sessionId, {
				results: products,
				currentPage: page,
				totalPages
			})

			return NextResponse.json({
				success: true,
				sessionId,
				data: products,
				page,
				total: products.length,
				hasMore
			})
		}

		// Если sessionId не передан, это первый запрос с изображением
		if (!image) {
			return NextResponse.json({ success: false, error: 'Изображение не загружено' }, { status: 400 })
		}

		// Проверяем тип файла (только JPG, PNG, WEBP)
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(image.type)) {
			return NextResponse.json({ success: false, error: 'Файл должен быть в формате JPG, PNG или WEBP' }, { status: 400 })
		}

		// Проверяем размер (максимум 3MB согласно документации)
		if (image.size > 3 * 1024 * 1024) {
			return NextResponse.json({ success: false, error: 'Размер изображения не должен превышать 3MB' }, { status: 400 })
		}

		// Шаг 1: Конвертируем файл в Base64
		const imageBase64 = await fileToBase64(image)

		const products: ProductItem[] = []
		const pageSize = 20
		let totalPages1688: number | undefined

		// Загружаем изображение на 1688
		const uploadResult1688 = await uploadImage1688(imageBase64)
		if (!uploadResult1688 || typeof uploadResult1688 !== 'object') {
			return NextResponse.json({ success: false, error: 'Ошибка загрузки изображения (1688)' }, { status: 500 })
		}
		const uploadObj1688 = uploadResult1688 as Record<string, unknown>
		if (uploadObj1688.code !== 200 || !uploadObj1688.data) {
			const errorMsg = (uploadObj1688.message as string) || 'Ошибка загрузки изображения (1688)'
			console.error('[/api/search-image] 1688 upload error:', errorMsg)
			return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
		}
		const uploadData1688 = uploadObj1688.data as Record<string, unknown>
		const imageId1688 = uploadData1688.imageId as string
		if (!imageId1688) {
			return NextResponse.json({ success: false, error: 'Не удалось получить imageId (1688)' }, { status: 500 })
		}

		// Загружаем изображение на Taobao
		const uploadResultTaobao = await uploadImageTaobao(imageBase64)
		if (!uploadResultTaobao || typeof uploadResultTaobao !== 'object') {
			return NextResponse.json({ success: false, error: 'Ошибка загрузки изображения (Taobao)' }, { status: 500 })
		}
		const uploadObjTaobao = uploadResultTaobao as Record<string, unknown>
		if (uploadObjTaobao.code !== 200 || !uploadObjTaobao.data) {
			const errorMsg = (uploadObjTaobao.message as string) || 'Ошибка загрузки изображения (Taobao)'
			console.error('[/api/search-image] Taobao upload error:', errorMsg)
			return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
		}
		const uploadDataTaobao = uploadObjTaobao.data as Record<string, unknown>
		const imageIdTaobao = uploadDataTaobao.imageId as string
		if (!imageIdTaobao) {
			return NextResponse.json({ success: false, error: 'Не удалось получить imageId (Taobao)' }, { status: 500 })
		}

		// Ищем товары на Taobao (только для первой страницы)
		if (page === 1) {
			const searchResultTaobao = await searchTaobaoProductsByImageId(imageIdTaobao, 'en', {
				page_no: 1,
				page_size: pageSize
			})
			if (searchResultTaobao && typeof searchResultTaobao === 'object') {
				const obj = searchResultTaobao as Record<string, unknown>
				if (obj.code === 200 && obj.data) {
					const data = obj.data as Record<string, unknown>
					const items = Array.isArray(data.data) ? data.data : []
					products.push(
						...items.map((item: Record<string, unknown>) => {
							const ml = item.multiLanguageInfo as { title?: string; language?: string } | Array<{ title?: string; language?: string }> | undefined
							let title = String(item.title || '')
							if (ml) {
								if (Array.isArray(ml)) {
									const ru = ml.find((m: { language?: string }) => m.language === 'ru')
									if (ru?.title) title = ru.title
									else if (ml[0]?.title) title = String(ml[0].title)
								} else if (ml.title) title = String(ml.title)
							}
							const priceCny = parseFloat(String(item.price || 0)) || 0
							return {
								productId: `taobao_${item.itemId}` || `img_search_${Date.now()}_${Math.random()}`,
								title,
								price: cnyToRub(priceCny).toFixed(2),
								imageUrl: String(item.mainImageUrl || item.pictUrl || ''),
								shopName: String(item.shopName || ''),
								sales: Number(item.sales) || 0,
								source: 'taobao' as const
							}
						})
					)
				}
			}
		}

		// Ищем товары на 1688 (для любой страницы)
		const searchResult1688 = await searchProductsByImageId1688(imageId1688, {
			beginPage: page,
			pageSize,
			country: 'ru'
		})
		if (searchResult1688 && typeof searchResult1688 === 'object') {
			const obj = searchResult1688 as Record<string, unknown>
			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				// Извлекаем totalPage из ответа 1688
				if (typeof data.totalPage === 'number') {
					totalPages1688 = data.totalPage
				}
				const items = Array.isArray(data.data) ? data.data : []
				products.push(
					...items.map((item: Record<string, unknown>) => {
						let priceStr = '0'
						if (typeof item.priceInfo === 'object') {
							priceStr = String((item.priceInfo as Record<string, unknown>).price || (item.priceInfo as Record<string, unknown>).consignPrice || '0')
						}
						const priceCny = parseFloat(priceStr) || 0
						return {
							productId: `1688_${item.offerId}` || `img_search_${Date.now()}_${Math.random()}`,
							title: String(item.subjectTrans || item.subject || ''),
							price: cnyToRub(priceCny).toFixed(2),
							imageUrl: String(item.imageUrl || item.whiteImage || ''),
							shopName: String(item.companyName || ''),
							sales: Number(item.monthSold) || 0,
							source: '1688' as const
						}
					})
				)
			}
		}

		if (products.length > 0) {
			const imageIds = {
				'1688': imageId1688,
				taobao: imageIdTaobao
			}
			const sources: ('1688' | 'taobao')[] = ['1688', 'taobao']
			const hasMore = totalPages1688 ? page < totalPages1688 : products.length >= pageSize
			const newSessionId = await createSession(products, {
				imageIds,
				sources,
				pageSize,
				currentPage: page,
				totalPages: totalPages1688
			})
			return NextResponse.json({
				success: true,
				sessionId: newSessionId,
				redirectUrl: `/image-search?sessionId=${newSessionId}&page=${page}`,
				data: products,
				page,
				total: products.length,
				hasMore
			})
		}

		return NextResponse.json(
			{
				success: false,
				error: 'По изображению ничего не найдено',
				data: []
			},
			{ status: 500 }
		)
	} catch (error) {
		console.error('[/api/search-image] Error:', error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				data: []
			},
			{ status: 500 }
		)
	}
}
