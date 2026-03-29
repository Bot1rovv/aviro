import CartStepper from '@/components/cart/CartStepper'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Корзина',
	description: 'Корзина Arivoo'
}

export default function CartPage() {
	return (
		<div className="container">
			<CartStepper />
		</div>
	)
}
