import { SOURCE_COLORS, SourceType } from '@/lib/constants/source-colors'

interface SourceBadgeProps {
	source: SourceType
	className?: string
	colors?: Record<SourceType, string>
}

export default function SourceBadge({ source, className = '', colors = SOURCE_COLORS }: SourceBadgeProps) {
	return <span className={`absolute top-2 right-2 px-2 py-1 text-xs text-white rounded ${colors[source]} ${className}`}>{source.toUpperCase()}</span>
}
