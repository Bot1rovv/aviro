import { ProductSource } from './product'

export interface CartItem {
	productId: string
	title: string
	price: string
	imageUrl: string
	source: ProductSource
	quantity: number
	color?: string
	size?: string
	skuId?: string
	weightGrams?: number
}

export interface CartState {
	items: CartItem[]
	totalItems: number
	totalPrice: number
	shippingCost: number
	moscowShippingCost: number
	addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
	removeItem: (productId: string, color?: string, size?: string, skuId?: string) => void
	updateQuantity: (productId: string, quantity: number, color?: string, size?: string, skuId?: string) => void
	setShippingCost: (cost: number) => void
	setMoscowShippingCost: (cost: number) => void
	clearCart: () => void
}