import { DELIVERY_DAYS_MAX, DELIVERY_DAYS_MIN } from '@/config/constants'
import { PackageCheck } from 'lucide-react'

interface DeliveryInfoProps {
	minDays?: number
	maxDays?: number
	className?: string
}

export default function DeliveryInfo({ minDays = DELIVERY_DAYS_MIN, maxDays = DELIVERY_DAYS_MAX, className = '' }: DeliveryInfoProps) {
	const deliveryText = minDays === maxDays ? `Доставим за ${minDays}+ дней` : `Доставим за ${minDays}-${maxDays} дней`
	return (
		<p className={`delivery flex items-center gap-2 ${className}`}>
			<PackageCheck />
			<span className="inline-block bg-green-100 px-3 py-1 rounded-xl text-green-800 text-sm">{deliveryText}</span>
		</p>
	)
}
