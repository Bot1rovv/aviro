interface PriceDisplayProps {
	price: number
	originalPrice?: number
	currency?: string
	className?: string
}

export default function PriceDisplay({ 
	price, 
	originalPrice, 
	currency = '₽',
	className = '' 
}: PriceDisplayProps) {
	const hasDiscount = originalPrice && originalPrice > price

	return (
		<div className={`flex items-baseline gap-4 ${className}`}>
			<span className="text-3xl font-bold text-red-500">
				{price.toLocaleString()} {currency}
			</span>
			{hasDiscount && (
				<span className="text-lg text-gray-400 line-through">
					{originalPrice.toLocaleString()} {currency}
				</span>
			)}
		</div>
	)
}
