import { CATEGORY_KEYWORD_MAP } from '@/config/category-keywords'
import type { Category1688 } from '@/types/category'

/**
 * Возвращает ключевое слово для поиска по ID категории
 */
export function getKeywordForCategory(
	categoryId: string,
	categories: Record<string, Category1688>
): string {
	if (CATEGORY_KEYWORD_MAP[categoryId]) {
		return CATEGORY_KEYWORD_MAP[categoryId]
	}
	const category = categories[categoryId]
	if (category) {
		if (category.name_en) return category.name_en.toLowerCase()
		if (category.name_ru) return category.name_ru.toLowerCase()
	}
	return 'товары'
}
