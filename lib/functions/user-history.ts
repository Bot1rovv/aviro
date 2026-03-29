import { CheckCircle, Clock, Eye, LucideIcon, Package, ShoppingCart, Star, User, XCircle } from 'lucide-react'

/**
 * Типы действий пользователя в истории
 */
export type UserActionType =
	| 'view_product'
	| 'add_to_favorites'
	| 'remove_from_favorites'
	| 'add_to_cart'
	| 'remove_from_cart'
	| 'update_profile'
	| 'create_order'
	| 'cancel_order'

/**
 * Получение названия действия по коду
 */
export function getActionLabel(action: string): string {
	switch (action) {
		case 'view_product':
			return 'Просмотр товара'
		case 'add_to_favorites':
			return 'Добавлено в избранное'
		case 'remove_from_favorites':
			return 'Удалено из избранного'
		case 'add_to_cart':
			return 'Добавлено в корзину'
		case 'remove_from_cart':
			return 'Удалено из корзины'
		case 'update_profile':
			return 'Изменение профиля'
		case 'create_order':
			return 'Оформлен заказ'
		case 'cancel_order':
			return 'Отменён заказ'
		default:
			return action
	}
}

/**
 * Получение иконки действия по коду
 */
export function getActionIcon(action: string): LucideIcon {
	switch (action) {
		case 'view_product':
			return Eye
		case 'add_to_favorites':
		case 'remove_from_favorites':
			return Star
		case 'add_to_cart':
		case 'remove_from_cart':
			return ShoppingCart
		case 'update_profile':
			return User
		case 'create_order':
		case 'cancel_order':
			return Package
		default:
			return Eye
	}
}

/**
 * Получение цвета иконки действия
 */
export function getActionIconColor(action: string): string {
	switch (action) {
		case 'view_product':
			return 'text-blue-500'
		case 'add_to_favorites':
			return 'text-yellow-500'
		case 'remove_from_favorites':
			return 'text-gray-400'
		case 'add_to_cart':
			return 'text-green-500'
		case 'remove_from_cart':
			return 'text-gray-400'
		case 'update_profile':
			return 'text-purple-500'
		case 'create_order':
			return 'text-green-600'
		case 'cancel_order':
			return 'text-red-500'
		default:
			return 'text-gray-500'
	}
}

/**
 * Получение иконки статуса заказа
 */
export function getOrderStatusIcon(status: string): LucideIcon {
	switch (status) {
		case 'delivered':
		case 'paid':
		case 'confirmed':
			return CheckCircle
		case 'processing':
		case 'pending':
			return Clock
		case 'cancelled':
		case 'refunded':
		case 'partially_refunded':
			return XCircle
		case 'shipped':
		case 'authorized':
		default:
			return Package
	}
}

/**
 * Получение текста статуса заказа
 */
export function getOrderStatusText(status: string): string {
	switch (status) {
		case 'pending':
			return 'Ожидание'
		case 'processing':
			return 'В обработке'
		case 'shipped':
			return 'Отправлен'
		case 'delivered':
			return 'Доставлен'
		case 'cancelled':
			return 'Отменён'
		case 'paid':
			return 'Оплачен'
		case 'confirmed':
			return 'Подтверждён'
		case 'refunded':
			return 'Возвращён'
		case 'partially_refunded':
			return 'Частично возвращён'
		case 'authorized':
			return 'Авторизован'
		default:
			return 'Неизвестно'
	}
}

/**
 * Получение класса цвета статуса заказа
 */
export function getOrderStatusColor(status: string): string {
	switch (status) {
		case 'delivered':
		case 'paid':
		case 'confirmed':
			return 'bg-green-100 text-green-800'
		case 'processing':
		case 'pending':
		case 'authorized':
			return 'bg-yellow-100 text-yellow-800'
		case 'shipped':
			return 'bg-blue-100 text-blue-800'
		case 'cancelled':
		case 'refunded':
			return 'bg-red-100 text-red-800'
		case 'partially_refunded':
			return 'bg-orange-100 text-orange-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}

/**
 * Получение истории пройденных статусов заказа на основе текущего статуса
 * Возвращает массив объектов с текстом и цветом
 */
export function getOrderStatusHistory(currentStatus: string): Array<{ status: string; text: string; color: string }> {
	// Определяем порядок статусов в типичном потоке
	const statusFlow = ['pending', 'paid', 'processing', 'shipped', 'delivered']
	// Дополнительные статусы, которые могут быть в истории
	const extraStatuses = ['confirmed', 'authorized', 'cancelled', 'refunded', 'partially_refunded']

	// Для каждого статуса определяем, какие статусы считаются пройденными
	const completed: string[] = []
	switch (currentStatus) {
		case 'pending':
			completed.push('pending')
			break
		case 'paid':
			completed.push('pending', 'paid')
			break
		case 'processing':
			completed.push('pending', 'paid', 'processing')
			break
		case 'shipped':
			completed.push('pending', 'paid', 'processing', 'shipped')
			break
		case 'delivered':
			completed.push('pending', 'paid', 'processing', 'shipped', 'delivered')
			break
		case 'cancelled':
			completed.push('pending')
			break
		case 'refunded':
		case 'partially_refunded':
			// Предполагаем, что возврат возможен после доставки
			completed.push('pending', 'paid', 'processing', 'shipped', 'delivered', currentStatus)
			break
		case 'confirmed':
			completed.push('pending', 'paid', 'confirmed')
			break
		case 'authorized':
			completed.push('pending', 'authorized')
			break
		default:
			// Для неизвестного статуса считаем, что пройден только он сам
			completed.push(currentStatus)
	}

	// Убираем дубликаты и преобразуем в объекты
	const uniqueCompleted = [...new Set(completed)]
	return uniqueCompleted.map(status => ({
		status,
		text: getOrderStatusText(status),
		color: getOrderStatusColor(status)
	}))
}
