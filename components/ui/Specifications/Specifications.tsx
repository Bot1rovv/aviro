interface SpecificationsProps {
	specifications: Record<string, string>
	title?: string
}

export default function Specifications({ specifications, title = 'Характеристики' }: SpecificationsProps) {
	if (!specifications || Object.keys(specifications).length === 0) {
		return null
	}

	return (
		<div className="border-t pt-4">
			<h3 className="font-semibold mb-3">{title}</h3>
			<dl className="space-y-2">
				{Object.entries(specifications).map(([key, value]) => (
					<div
						key={key}
						className="flex justify-between"
					>
						<dt className="text-gray-600">{key}</dt>
						<dd className="font-medium">{String(value)}</dd>
					</div>
				))}
			</dl>
		</div>
	)
}
