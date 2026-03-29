// Общие константы приложения

export const APP_NAME = 'Arivoo'
export const APP_DESCRIPTION = 'Маркетплейс с товарами с 1688, Taobao и Poizon'

// Breakpoints (должны совпадать с Tailwind)
export const DESKTOP_BREAKPOINT = 1024 // Tailwind lg
export const TABLET_BREAKPOINT = 768 // Tailwind md

// API
export const API_TIMEOUT = 30000 // 30 секунд

// Пагинация
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Время доставки
export const DELIVERY_DAYS_MIN = 25
export const DELIVERY_DAYS_MAX = 25

// Курс: 1 юань (CNY) = N рублей (RUB). Цены с API приходят в юанях.
export const CNY_TO_RUB_RATE = 12

// Надбавка к цене (процент)
export const PRICE_MARKUP_PERCENT = 20

// Округление цены (true - без копеек, false - с копейками)
export const PRICE_ROUND_UP = true

// Цвета (CSS переменные)
export const COLORS = {
	ACCENT: '#0752c2',
	PRIMARY: '#ff8400',
	TEXT: '#666666',
	BLACK: '#0f2332'
} as const

// Сообщения
export const MESSAGES = {
	CART_EMPTY: 'Корзина пуста',
	CART_TITLE: 'Корзина',
	CART_ITEM: 'товар',
	CART_ITEMS: 'товара',
	CART_ITEMS_PLURAL: 'товаров',
	LOADING: 'Загрузка...',
	ERROR: 'Произошла ошибка',
	NO_RESULTS: 'Ничего не найдено',
	ADD_TO_CART: 'В корзину',
	IN_CART: 'В корзине',
	REMOVE_FROM_CART: 'Удалить из корзины',
	ADD_TO_FAVORITES: 'Добавить в избранное',
	REMOVE_FROM_FAVORITES: 'Удалить из избранного',
	CHECKOUT: 'Оформить заказ',
	CLEAR_CART: 'Очистить корзину',
	BACK_TO_MAIN: 'На главную',
	SEARCH_PLACEHOLDER: 'Поиск товаров...',
	DELIVERY_TIME: `Доставим за 25+ дней`
} as const

// Источники
export const SOURCES = ['taobao', '1688', 'poizon'] as const
export type Source = (typeof SOURCES)[number]

// Количество товаров для отображения
export const PRODUCT_CARD_LIMIT = 20
export const PRODUCT_IMAGES_LIMIT = 10
