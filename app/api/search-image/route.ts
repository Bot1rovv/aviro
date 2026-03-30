import { searchProductsByImageId1688, searchTaobaoProductsByImageId, uploadImage1688, uploadImageTaobao } from '@/lib/api-client'
import { createSession, getSession, updateSession } from '@/lib/session-store-db'
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

		// 1. ПАГИНАЦИЯ ПО СУЩЕСТВУЮЩЕЙ СЕССИИ
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

			const includeTaobao = page === 1 && sources.includes('taobao')
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
								const ml =
									(item.multiLanguageInfo as
										| { title?: string; language?: string }
										| Array<{ title?: string; language?: string }>
										| undefined)

								let title = String(item.title || '')

								if (ml) {
									if (Array.isArray(ml)) {
										const ru = ml.find((m: { language?: string }) => m.language === 'ru')
										if (ru?.title) title = ru.title
										else if (ml[0]?.title) title = String(ml[0].title)
									} else if (ml.title) {
										title = String(ml.title)
									}
								}

								const priceCny = parseFloat(String(item.price || 0)) || 0

								return {
									productId: `taobao_${item.itemId}`,
									title,
									price: priceCny.toString(),
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
						let currentTotalPages = totalPages

						if (typeof data.totalPage === 'number') {
							currentTotalPages = data.totalPage
						}

						const items = Array.isArray(data.data) ? data.data : []

						products.push(
							...items.map((item: Record<string, unknown>) => {
								let priceStr = '0'

								if (typeof item.priceInfo === 'object' && item.priceInfo) {
									const priceInfo = item.priceInfo as Record<string, unknown>
									priceStr = String(priceInfo.price || priceInfo.consignPrice || '0')
								}

								const priceCny = parseFloat(priceStr) || 0

								return {
									productId: `1688_${item.offerId}`,
									title: String(item.subjectTrans || item.subject || ''),
									price: priceCny.toString(),
									imageUrl: String(item.imageUrl || item.whiteImage || ''),
									shopName: String(item.companyName || ''),
									sales: Number(item.monthSold) || 0,
									source: '1688' as const
								}
							})
						)

						if (currentTotalPages !== undefined) {
							hasMore = page < currentTotalPages
						} else {
							hasMore = items.length >= pageSize
						}
					}
				}
			}

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

		// 2. ПЕРВАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЯ
		if (!image) {
			return NextResponse.json({ success: false, error: 'Изображение не загружено' }, { status: 400 })
		}

		// Лимит на твоей стороне
		const MAX_FILE_SIZE_MB = 10
		const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024

		if (image.size > maxBytes) {
			return NextResponse.json(
				{
					success: false,
					error: `Изображение слишком большое (${(image.size / 1024 / 1024).toFixed(2)} МБ). Загрузите файл до ${MAX_FILE_SIZE_MB} МБ.`
				},
				{ status: 400 }
			)
		}

		const buffer = await image.arrayBuffer()
		const base64String = Buffer.from(buffer).toString('base64')
		const imageBase64 = `data:${image.type};base64,${base64String}`

		const products: ProductItem[] = []
		const pageSize = 20
		let totalPages1688: number | undefined

		// 1688 upload
		const uploadResult1688 = await uploadImage1688(imageBase64)
		if (!uploadResult1688 || typeof uploadResult1688 !== 'object') {
			return NextResponse.json({ success: false, error: 'Ошибка загрузки изображения (1688)' }, { status: 500 })
		}

		const uploadObj1688 = uploadResult1688 as Record<string, unknown>

		if (uploadObj1688.code !== 200 || !uploadObj1688.data) {
			const errorMsg =
				(uploadObj1688.message as string) ||
				(uploadObj1688.detail as string) ||
				'Ошибка загрузки изображения в 1688'

			if (errorMsg.includes('MaxUploadSizeExceededException')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Файл принят сайтом, но сервер 1688 отклонил его как слишком большой. Попробуйте более лёгкое изображение.'
					},
					{ status: 400 }
				)
			}

			return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
		}

		const imageId1688 = (uploadObj1688.data as Record<string, unknown>).imageId as string

		// Taobao upload
		const uploadResultTaobao = await uploadImageTaobao(imageBase64)
		if (!uploadResultTaobao || typeof uploadResultTaobao !== 'object') {
			return NextResponse.json({ success: false, error: 'Ошибка загрузки изображения (Taobao)' }, { status: 500 })
		}

		const uploadObjTaobao = uploadResultTaobao as Record<string, unknown>

		if (uploadObjTaobao.code !== 200 || !uploadObjTaobao.data) {
			const errorMsg =
				(uploadObjTaobao.message as string) ||
				(uploadObjTaobao.detail as string) ||
				'Ошибка загрузки изображения в Taobao'

			if (errorMsg.includes('MaxUploadSizeExceededException')) {
				return NextResponse.json(
					{
						success: false,
						error: 'Файл принят сайтом, но сервер Taobao отклонил его как слишком большой. Попробуйте более лёгкое изображение.'
					},
					{ status: 400 }
				)
			}

			return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
		}

		const imageIdTaobao = (uploadObjTaobao.data as Record<string, unknown>).imageId as string

		// Поиск Taobao
		if (page === 1 && imageIdTaobao) {
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
							const priceCny = parseFloat(String(item.price || 0)) || 0

							return {
								productId: `taobao_${item.itemId}`,
								title: String(item.title || ''),
								price: priceCny.toString(),
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

		// Поиск 1688
		if (imageId1688) {
			const searchResult1688 = await searchProductsByImageId1688(imageId1688, {
				beginPage: page,
				pageSize,
				country: 'ru'
			})

			if (searchResult1688 && typeof searchResult1688 === 'object') {
				const obj = searchResult1688 as Record<string, unknown>

				if (obj.code === 200 && obj.data) {
					const data = obj.data as Record<string, unknown>

					if (typeof data.totalPage === 'number') {
						totalPages1688 = data.totalPage
					}

					const items = Array.isArray(data.data) ? data.data : []

					products.push(
						...items.map((item: Record<string, unknown>) => {
							let priceStr = '0'

							if (typeof item.priceInfo === 'object' && item.priceInfo) {
								const priceInfo = item.priceInfo as Record<string, unknown>
								priceStr = String(priceInfo.price || priceInfo.consignPrice || '0')
							}

							const priceCny = parseFloat(priceStr) || 0

							return {
								productId: `1688_${item.offerId}`,
								title: String(item.subjectTrans || item.subject || ''),
								price: priceCny.toString(),
								imageUrl: String(item.imageUrl || item.whiteImage || ''),
								shopName: String(item.companyName || ''),
								sales: Number(item.monthSold) || 0,
								source: '1688' as const
							}
						})
					)
				}
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
			{ status: 404 }
		)
	} catch (error) {
		console.error('[/api/search-image] Error:', error)

		if (error instanceof Error && error.message.includes('body size limit exceeded')) {
			return NextResponse.json(
				{
					success: false,
					error: 'Файл слишком большой. Пожалуйста, загрузите картинку меньшего размера.',
					data: []
				},
				{ status: 400 }
			)
		}

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