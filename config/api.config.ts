export const API_CONFIG = {
	BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://openapi.dajisaas.com',
	// Ключи должны быть в .env.local
	ACCESS_KEY: process.env.NEXT_PUBLIC_DAJI_ACCESS_KEY || '',
	ACCESS_SECRET: process.env.NEXT_PUBLIC_DAJI_ACCESS_SECRET || ''
} as const

export const ENDPOINTS = {
	// 1688 Product Search
	IMAGE_SEARCH: '/alibaba/product/imageQuery',
	KEYWORD_SEARCH: '/alibaba/product/keywordQuery',
	PRODUCT_DETAILS: '/alibaba/product/queryProductDetail',
	CATEGORY_QUERY: '/alibaba/category/get',
	// 1688 Image Upload
	UPLOAD_IMAGE_1688: '/alibaba/upload/image',
	// 1688 Freight (используется freightEstimate согласно документации)
	FREIGHT_1688: '/alibaba/product/freightEstimate',
	// Taobao/Tmall API (реальные endpoints из документации)
	TAOBAO_KEYWORD_SEARCH: '/taobao/traffic/item/search',
	TAOBAO_IMAGE_SEARCH: '/taobao/traffic/item/imgsearch',
	TAOBAO_IMAGE_SEARCH_V2: '/taobao/image-search/url',
	TAOBAO_PRODUCT_DETAILS: '/taobao/traffic/item/get',
	TAOBAO_SHOP_SEARCH: '/taobao/traffic/item/shop/search',
	TAOBAO_THEME_LIST: '/taobao/traffic/getThemeDimList',
	TAOBAO_THEME_DETAIL: '/taobao/traffic/getThemeDetail',
	TAOBAO_LOGISTIC_PRICE: '/taobao/traffic/item/logisticPrice/get',
	TAOBAO_UPLOAD_IMAGE: '/taobao/upload/image',
	TAOBAO_PRODUCT_GET: '/taobao/product/get',
	TAOBAO_ORDER_RENDER: '/taobao/purchase/order/render',
	TAOBAO_ORDER_CREATE: '/taobao/purchase/order/create',
	TAOBAO_ORDER_CANCEL: '/taobao/purchase/order/asyn/cancel',
	TAOBAO_ORDER_QUERY: '/taobao/purchase/order/query',
	TAOBAO_ORDER_PAY: '/taobao/purchase/order/batch/pay',
	// Poizon API
	POIZON_KEYWORD_SEARCH: '/poizon/product/queryList',
	POIZON_PRODUCT_DETAIL: '/poizon/product/queryDetail',
	POIZON_CATEGORY_GET: '/poizon/category/get'
} as const
