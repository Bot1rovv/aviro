interface QuantitySelectorProps {
	value: number
	onChange: (value: number) => void
	min?: number
	max?: number
	className?: string
}

export default function QuantitySelector({ value, onChange, min = 1, max = 999, className = '' }: QuantitySelectorProps) {
	const handleDecrease = () => {
		if (value > min) {
			onChange(value - 1)
		}
	}

	const handleIncrease = () => {
		if (value < max) {
			onChange(value + 1)
		}
	}

	return (
		<div className={`flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1 w-max max-w-[120px] ${className}`}>
			<button
				onClick={handleDecrease}
				className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-50"
				disabled={value <= min}
			>
				-
			</button>
			<span className="w-8 text-center">{value}</span>
			<button
				onClick={handleIncrease}
				className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded disabled:opacity-50"
				disabled={value >= max}
			>
				+
			</button>
		</div>
	)
}
