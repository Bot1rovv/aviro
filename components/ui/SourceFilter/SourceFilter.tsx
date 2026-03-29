'use client'

interface SourceCounts {
	taobao: number
	'1688': number
	poizon: number
}

interface SourceFilterProps {
	counts: SourceCounts
	className?: string
}

export default function SourceFilter({ counts, className = '' }: SourceFilterProps) {
	return (
		<div className={`mb-4 flex gap-4 text-sm text-gray-600 ${className}`}>
			<span className="flex items-center gap-1">
				<span className="w-2 h-2 bg-orange-500 rounded-full"></span>
				Taobao: {counts.taobao}
			</span>
			<span className="flex items-center gap-1">
				<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
				1688: {counts['1688']}
			</span>
			<span className="flex items-center gap-1">
				<span className="w-2 h-2 bg-green-500 rounded-full"></span>
				Poizon: {counts.poizon}
			</span>
		</div>
	)
}
