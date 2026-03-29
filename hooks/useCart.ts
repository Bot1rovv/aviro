import { useCartStore } from '@/lib/store/cart'
import { CartItem } from '@/types/cart'
import { toast } from 'sonner'

/**
 * Хук для работы с корзиной, добавляющий уведомления (toast).
 * Предоставляет методы addItem, removeItem, updateQuantity, clearCart,
 * а также состояние items, totalItems, totalPrice, shippingCost.
 */
export function useCart() {
	const { addItem, removeItem, updateQuantity, clearCart, setShippingCost, items, totalItems, totalPrice, shippingCost } = useCartStore()

	const addItemWithToast = (item: Omit<CartItem, 'quantity'>) => {
		addItem(item)
		toast.success('Товар добавлен в корзину')
	}

	const removeItemWithToast = (productId: string) => {
		removeItem(productId)
		toast.success('Товар удалён из корзины')
	}

	const updateQuantityWithToast = (productId: string, quantity: number) => {
		updateQuantity(productId, quantity)
		toast.success('Количество обновлено')
	}

	const clearCartWithToast = () => {
		clearCart()
		toast.success('Корзина очищена')
	}

	const isInCart = (productId: string) => items.some(item => item.productId === productId)

	return {
		items,
		totalItems,
		totalPrice,
		shippingCost,
		addItem: addItemWithToast,
		removeItem: removeItemWithToast,
		updateQuantity: updateQuantityWithToast,
		clearCart: clearCartWithToast,
		setShippingCost,
		isInCart
	}
}
