// No need to import jest globals, they are available globally

import { CartItem } from '@/types/cart'
import { ProductSource } from '@/types/product'
import { useCartStore } from '../cart'

// Mock localStorage for persist middleware
const localStorageMock = (() => {
	let store: Record<string, string> = {}
	return {
		getItem(key: string) {
			return store[key] || null
		},
		setItem(key: string, value: string) {
			store[key] = value
		},
		removeItem(key: string) {
			delete store[key]
		},
		clear() {
			store = {}
		}
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
})

describe('Cart Store', () => {
	beforeEach(() => {
		// Reset the store before each test
		useCartStore.setState({
			items: [],
			totalItems: 0,
			totalPrice: 0
		})
		localStorageMock.clear()
	})

	it('should have initial empty state', () => {
		const { items, totalItems, totalPrice } = useCartStore.getState()
		expect(items).toEqual([])
		expect(totalItems).toBe(0)
		expect(totalPrice).toBe(0)
	})

	it('should add a new item', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)

		const { items, totalItems, totalPrice } = useCartStore.getState()
		expect(items).toHaveLength(1)
		expect(items[0]).toEqual({ ...item, quantity: 1 })
		expect(totalItems).toBe(1)
		expect(totalPrice).toBe(100)
	})

	it('should increment quantity when adding existing item', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)
		useCartStore.getState().addItem(item)

		const { items, totalItems, totalPrice } = useCartStore.getState()
		expect(items).toHaveLength(1)
		expect(items[0].quantity).toBe(2)
		expect(totalItems).toBe(2)
		expect(totalPrice).toBe(200)
	})

	it('should remove an item', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)
		expect(useCartStore.getState().items).toHaveLength(1)

		useCartStore.getState().removeItem('1')
		const { items } = useCartStore.getState()
		expect(items).toHaveLength(0)
		expect(items).toEqual([])
	})

	it('should update item quantity', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)
		useCartStore.getState().updateQuantity('1', 5)

		const { items, totalItems, totalPrice } = useCartStore.getState()
		expect(items[0].quantity).toBe(5)
		expect(totalItems).toBe(5)
		expect(totalPrice).toBe(500)
	})

	it('should not update quantity if zero or negative', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)
		// Try to set quantity to 0 (should keep previous state)
		useCartStore.getState().updateQuantity('1', 0)
		expect(useCartStore.getState().items[0].quantity).toBe(1)

		// Try negative
		useCartStore.getState().updateQuantity('1', -3)
		expect(useCartStore.getState().items[0].quantity).toBe(1)
	})

	it('should clear cart', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '1',
			title: 'Test Product',
			price: '100',
			imageUrl: 'test.jpg',
			source: 'taobao' as ProductSource
		}

		useCartStore.getState().addItem(item)
		expect(useCartStore.getState().items).toHaveLength(1)

		useCartStore.getState().clearCart()
		const { items, totalItems, totalPrice } = useCartStore.getState()
		expect(items).toEqual([])
		expect(totalItems).toBe(0)
		expect(totalPrice).toBe(0)
	})

	it('should persist state to localStorage', () => {
		const item: Omit<CartItem, 'quantity'> = {
			productId: '2',
			title: 'Persisted Product',
			price: '50',
			imageUrl: 'persist.jpg',
			source: '1688' as ProductSource
		}

		useCartStore.getState().addItem(item)
		// The persist middleware writes asynchronously; we can check localStorage after a tick
		setTimeout(() => {
			const stored = localStorageMock.getItem('cart-storage')
			expect(stored).toBeTruthy()
			if (stored) {
				const parsed = JSON.parse(stored)
				expect(parsed.state.items).toHaveLength(1)
			}
		}, 0)
	})
})
