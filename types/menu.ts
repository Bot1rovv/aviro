import type { LucideIcon } from 'lucide-react'

/**
 * Элемент меню каталога (категория с опциональной иконкой)
 */
export interface MenuItem {
	id: string
	title: string
	link: string
	icon: LucideIcon
	subcategories?: Record<string, string>
}
