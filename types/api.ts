/**
 * Типы ответов API (сырые структуры от 1688, Taobao, Poizon)
 */

/** Элемент ответа поиска Taobao (сырой) */
export interface TaobaoProductResponse {
	itemId: number
	price: string
	title: string
	mainImageUrl: string
	shopName?: string
	sales?: number
	multiLanguageInfo?:
		| { title: string; language: string }
		| Array<{ title: string; language: string }>
}
