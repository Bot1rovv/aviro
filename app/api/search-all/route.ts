import { getPoizonProducts, searchProductsByKeyword, searchTaobaoProductsByKeyword } from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import type { TaobaoProductResponse } from '@/types/api'
import { ProductItem } from '@/types/product'
import { NextRequest, NextResponse } from 'next/server'

// Пуленепробиваемая конвертация цены
const safeConvert = (cny: number | null | undefined | typeof NaN) => {
    if (cny === null || cny === undefined || Number.isNaN(cny)) return 0

    try {
        const rub = cnyToRub(cny)
        return rub && rub > 0 ? rub : cny * 13.5
    } catch (e) {
        return cny * 13.5
    }
}

// Поиск товаров с Taobao
async function searchTaobao(keyword: string, page: number): Promise<ProductItem[]> {
    try {
        const result = await searchTaobaoProductsByKeyword(keyword, {
            page_no: page,
            page_size: 20
        })

        if (result && typeof result === 'object') {
            const obj = result as Record<string, unknown>

            if (obj.code === 200 && obj.data) {
                const data = obj.data as Record<string, unknown>
                const items = Array.isArray(data.data) ? data.data : []

                return items.map((item: TaobaoProductResponse) => {
                    const itemAny = item as any
                    const rawPrice = String(
                        itemAny.price || itemAny.promotionPrice || itemAny.promotion_price || '0'
                    ).replace(/[^0-9.]/g, '')

                    const priceCny = parseFloat(rawPrice) || 0

                    return {
                        productId: `taobao_${item.itemId}` || `mock_taobao_${Date.now()}`,
                        title: getTaobaoTitle(item),
                        price: Math.ceil(safeConvert(priceCny)).toString(),
                        imageUrl: item.mainImageUrl || 'https://via.placeholder.com/300',
                        shopName: item.shopName,
                        sales: item.sales,
                        source: 'taobao' as const
                    }
                })
            }
        }

        return []
    } catch (error) {
        console.error('Taobao search error:', error)
        return []
    }
}

// Поиск товаров с 1688
async function search1688(keyword: string, page: number): Promise<ProductItem[]> {
    try {
        const result = await searchProductsByKeyword(keyword, {
            beginPage: page,
            pageSize: 20
        })

        if (result && typeof result === 'object') {
            const obj = result as Record<string, unknown>

            if (obj.code === 200 && obj.data) {
                const data = obj.data as Record<string, unknown>
                const items = Array.isArray(data.data) ? data.data : []

                return items.map((item: Record<string, unknown>) => {
                    let price = String(item.price || item.showPrice || item.currentPrice || '0')
                    const priceInfo = item.priceInfo

                    if (priceInfo && typeof priceInfo === 'object') {
                        price = String(
                            (priceInfo as Record<string, unknown>).price ||
                                (priceInfo as Record<string, unknown>).consignPrice ||
                                price
                        )
                    } else if (priceInfo && typeof priceInfo === 'string') {
                        const match = priceInfo.match(/price[=\s]*(\d+\.?\d*)/i)
                        if (match) price = match[1]
                    }

                    price = price.replace(/[^0-9.]/g, '')
                    const priceCny = parseFloat(price) || 0
                    const title = String(item.subjectTrans || item.subject || '')
                    const imageUrl = String(item.imageUrl || item.whiteImage || '')

                    return {
                        productId: `1688_${item.offerId}` || `mock_1688_${Date.now()}`,
                        title,
                        price: Math.ceil(safeConvert(priceCny)).toString(),
                        imageUrl: imageUrl || 'https://via.placeholder.com/300',
                        shopName: String(item.companyName || ''),
                        sales: Number(item.monthSold || 0),
                        source: '1688' as const
                    }
                })
            }
        }

        return []
    } catch (error) {
        console.error('1688 search error:', error)
        return []
    }
}

// Поиск товаров с Poizon
async function searchPoizon(keyword: string, page: number): Promise<ProductItem[]> {
    try {
        const startId = (page - 1) * 20 + 1

        const result = await getPoizonProducts(keyword, undefined, undefined, {
            startId: String(startId),
            pageSize: 20
        })

        if (result && typeof result === 'object') {
            const obj = result as Record<string, unknown>

            if (obj.code === 200 && obj.data) {
                const data = obj.data as Record<string, unknown>
                const items = Array.isArray(data.spuList) ? data.spuList : []

                return items.map((item: Record<string, unknown>) => {
                    const priceCny = Number(item.authPrice || item.price || 0) / 100

                    return {
                        productId: `poizon_${item.dwSpuId}` || `mock_poizon_${Date.now()}`,
                        title: String(item.distSpuTitle || item.dwSpuTitle || ''),
                        price: Math.ceil(safeConvert(priceCny)).toString(),
                        imageUrl: String(item.image || (Array.isArray(item.baseImage) ? item.baseImage[0] : '')),
                        shopName: String(item.distBrandName || ''),
                        sales: Number(item.sales || 0),
                        source: 'poizon' as const
                    }
                })
            }
        }

        return []
    } catch (error) {
        console.error('Poizon search error:', error)
        return []
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams

    // Ищем и q, и keyword, и query
    const keyword =
        searchParams.get('q') ||
        searchParams.get('keyword') ||
        searchParams.get('query') ||
        'товары'

    const page = parseInt(searchParams.get('page') || '1', 10)

    try {
        const [taobaoProducts, products1688, poizonProducts] = await Promise.all([
            searchTaobao(keyword, page),
            search1688(keyword, page),
            searchPoizon(keyword, page)
        ])

        const allProducts: ProductItem[] = [
            ...taobaoProducts,
            ...products1688,
            ...poizonProducts
        ]

        return NextResponse.json(
            {
                success: true,
                data: allProducts,
                sources: {
                    taobao: taobaoProducts.length,
                    '1688': products1688.length,
                    poizon: poizonProducts.length
                }
            },
            {
                headers: {
                    'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
                }
            }
        )
    } catch (error) {
        console.error('[/api/search-all] Error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                data: [],
                sources: {
                    taobao: 0,
                    '1688': 0,
                    poizon: 0
                }
            },
            { status: 500 }
        )
    }
}