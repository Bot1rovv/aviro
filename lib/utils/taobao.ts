import type { TaobaoProductResponse } from '@/types/api'

/**
 * Выбирает русский заголовок из multiLanguageInfo, иначе любой переведённый, иначе оригинал
 */
export function getTaobaoTitle(item: TaobaoProductResponse): string {
	const ml = item.multiLanguageInfo
	if (!ml) return item.title || ''
	if (Array.isArray(ml)) {
		const ru = ml.find(m => m.language === 'ru')
		if (ru?.title) return ru.title
		if (ml[0]?.title) return ml[0].title
	} else if (ml.title) return ml.title
	return item.title || ''
}
