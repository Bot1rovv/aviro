import { CartItem, CartState } from '@/types/cart'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const isSameItem = (a: CartItem, b: Omit<CartItem, 'quantity'>) => {
	if (a.productId !== b.productId) return false
	if (a.skuId !== b.skuId) return false
	if (a.color !== b.color) return false
	if (a.size !== b.size) return false
	return true
}

const findItemIndex = (items: CartItem[], productId: string, color?: string, size?: string, skuId?: string) => {
	return items.findIndex(item => {
		if (item.productId !== productId) return false
		if (skuId !== undefined && item.skuId !== skuId) return false
		if (color !== undefined && item.color !== color) return false
		if (size !== undefined && item.size !== size) return false
		return true
	})
}

export const useCartStore = create<CartState>()(
	persist(
		set => ({
			items: [],
			totalItems: 0,
			totalPrice: 0,
			shippingCost: 0,
			moscowShippingCost: 0,

			addItem: item =>
				set(state => {
					const existingIndex = state.items.findIndex(i => isSameItem(i, item))
					let newItems: CartItem[]
					const quantity = item.quantity || 1

					if (existingIndex >= 0) {
						newItems = state.items.map((i, idx) => (idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i))
					} else {
						newItems = [...state.items, { ...item, quantity }]
					}

					return {
						items: newItems,
						totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
						totalPrice: newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0)
					}
				}),

			removeItem: (productId, color, size, skuId) =>
				set(state => {
					const index = findItemIndex(state.items, productId, color, size, skuId)
					let newItems: CartItem[]

					if (index >= 0) {
						newItems = state.items.filter((_, i) => i !== index)
					} else {
						newItems = state.items.filter(i => i.productId !== productId)
					}

					return {
						items: newItems,
						totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
						totalPrice: newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0)
					}
				}),

			updateQuantity: (productId, quantity, color, size, skuId) =>
				set(state => {
					if (quantity <= 0) return state

					const index = findItemIndex(state.items, productId, color, size, skuId)
					let newItems: CartItem[]

					if (index >= 0) {
						newItems = state.items.map((item, idx) => (idx === index ? { ...item, quantity } : item))
					} else {
						newItems = state.items.map(item => (item.productId === productId ? { ...item, quantity } : item))
					}

					return {
						items: newItems,
						totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
						totalPrice: newItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0)
					}
				}),

			setShippingCost: (cost: number) =>
				set({
					shippingCost: cost
				}),

			setMoscowShippingCost: (cost: number) =>
				set({
					moscowShippingCost: cost
				}),

			clearCart: () =>
				set({
					items: [],
					totalItems: 0,
					totalPrice: 0,
					shippingCost: 0,
					moscowShippingCost: 0
				})
		}),
		{
			name: 'cart-storage'
		}
	)
)

export type { CartItem, CartState } from '@/types/cart'