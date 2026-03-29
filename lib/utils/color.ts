import Color from 'color'

/**
 * Преобразует название цвета (на любом языке) в hex-код.
 * Использует библиотеку color для парсинга CSS named colors.
 * Если цвет не распознан, возвращает fallback hex (по умолчанию серый #cccccc).
 */
export function getColorHex(colorName: string, fallback = '#cccccc'): string {
	if (!colorName || typeof colorName !== 'string') return fallback

	const trimmed = colorName.trim()
	if (!trimmed) return fallback

	// Если строка уже hex-код (начинается с #)
	if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(trimmed)) {
		return trimmed.toLowerCase()
	}

	// Если строка в формате rgb/rgba
	if (trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
		try {
			return Color(trimmed).hex().toLowerCase()
		} catch {
			return fallback
		}
	}

	// Попробуем перевести русские названия на английские (базовые)
	const englishColor = translateColorToEnglish(trimmed)
	try {
		const color = Color(englishColor)
		return color.hex().toLowerCase()
	} catch {
		// Если не получилось, попробуем исходную строку
		try {
			const color = Color(trimmed)
			return color.hex().toLowerCase()
		} catch {
			return fallback
		}
	}
}

/**
 * Переводит распространённые русские названия цветов на английские.
 * Также обрабатывает некоторые китайские/английские варианты.
 */
function translateColorToEnglish(color: string): string {
	const lower = color.toLowerCase()

	// Маппинг русских -> английских (основные цвета)
	const ruToEn: Record<string, string> = {
		красный: 'red',
		красная: 'red',
		красное: 'red',
		красные: 'red',
		красного: 'red',
		зелёный: 'green',
		зеленый: 'green',
		зелёная: 'green',
		зелёное: 'green',
		зелёные: 'green',
		зеленого: 'green',
		синий: 'blue',
		синяя: 'blue',
		синее: 'blue',
		синие: 'blue',
		синего: 'blue',
		голубой: 'lightblue',
		голубая: 'lightblue',
		голубое: 'lightblue',
		голубые: 'lightblue',
		голубого: 'lightblue',
		жёлтый: 'yellow',
		желтый: 'yellow',
		жёлтая: 'yellow',
		жёлтое: 'yellow',
		жёлтые: 'yellow',
		желтого: 'yellow',
		чёрный: 'black',
		черный: 'black',
		чёрная: 'black',
		чёрное: 'black',
		чёрные: 'black',
		черного: 'black',
		белый: 'white',
		белая: 'white',
		белое: 'white',
		белые: 'white',
		белого: 'white',
		серый: 'gray',
		серая: 'gray',
		серое: 'gray',
		серые: 'gray',
		серого: 'gray',
		фиолетовый: 'purple',
		фиолетовая: 'purple',
		фиолетовое: 'purple',
		фиолетовые: 'purple',
		фиолетового: 'purple',
		розовый: 'pink',
		розовая: 'pink',
		розовое: 'pink',
		розовые: 'pink',
		розового: 'pink',
		оранжевый: 'orange',
		оранжевая: 'orange',
		оранжевое: 'orange',
		оранжевые: 'orange',
		оранжевого: 'orange',
		коричневый: 'brown',
		коричневая: 'brown',
		коричневое: 'brown',
		коричневые: 'brown',
		коричневого: 'brown',
		бирюзовый: 'turquoise',
		бирюзовая: 'turquoise',
		бирюзовое: 'turquoise',
		бирюзовые: 'turquoise',
		бирюзового: 'turquoise',
		бежевый: 'beige',
		бежевая: 'beige',
		бежевое: 'beige',
		бежевые: 'beige',
		бежевого: 'beige',
		// Дополнительные
		бордовый: 'maroon',
		бордовая: 'maroon',
		бордовое: 'maroon',
		бордовые: 'maroon',
		бордового: 'maroon',
		лазурный: 'azure',
		лазурная: 'azure',
		лазурное: 'azure',
		лазурные: 'azure',
		лазурного: 'azure',
		салатовый: 'lime',
		салатовая: 'lime',
		салатовое: 'lime',
		салатовые: 'lime',
		салатового: 'lime',
		сиреневый: 'lavender',
		сиреневая: 'lavender',
		сиреневое: 'lavender',
		сиреневые: 'lavender',
		сиреневого: 'lavender',
		лиловый: 'violet',
		лиловая: 'violet',
		лиловое: 'violet',
		лиловые: 'violet',
		лилового: 'violet',
		золотой: 'gold',
		золотая: 'gold',
		золотое: 'gold',
		золотые: 'gold',
		золотого: 'gold',
		серебряный: 'silver',
		серебряная: 'silver',
		серебряное: 'silver',
		серебряные: 'silver',
		серебряного: 'silver',
		хаки: 'khaki',
		оливковый: 'olive',
		оливковая: 'olive',
		оливковое: 'olive',
		оливковые: 'olive',
		оливкового: 'olive',
		мятный: 'mint',
		мятная: 'mint',
		мятное: 'mint',
		мятные: 'mint',
		мятного: 'mint',
		коралловый: 'coral',
		коралловая: 'coral',
		коралловое: 'coral',
		коралловые: 'coral',
		кораллового: 'coral',
		персиковый: 'peachpuff',
		персиковая: 'peachpuff',
		персиковое: 'peachpuff',
		персиковые: 'peachpuff',
		персикового: 'peachpuff',
		// Китайские (простые)
		红色: 'red',
		绿色: 'green',
		蓝色: 'blue',
		黄色: 'yellow',
		黑色: 'black',
		白色: 'white',
		灰色: 'gray',
		紫色: 'purple',
		粉色: 'pink',
		橙色: 'orange',
		棕色: 'brown',
		青色: 'cyan',
		金色: 'gold',
		银色: 'silver'
	}

	// Проверяем точное совпадение
	if (ruToEn[lower]) {
		return ruToEn[lower]
	}

	// Проверяем частичные совпадения
	for (const [ru, en] of Object.entries(ruToEn)) {
		if (lower.includes(ru)) {
			return en
		}
	}

	// Если не нашли, возвращаем исходную строку (библиотека color может распознать английские названия)
	return color
}

/**
 * Нормализует название цвета: удаляет скобки, оттенки, фильтрует некорректные значения.
 * Возвращает очищенную строку (оригинальное значение).
 */
export function normalizeColor(color: string): string {
	if (!color) return ''
	let cleaned = color.trim()
	// Удаляем все скобки и их содержимое (круглые, квадратные, китайские)
	cleaned = cleaned.replace(/[()【】\[\]]/g, ' ').trim()
	// Разбиваем по запятой, дефису, пробелу
	const parts = cleaned.split(/[,\-\s]+/)
	// Словарь цветов из translateColorToEnglish (русские и китайские названия)
	const colorWords = [
		'красный',
		'красная',
		'красное',
		'красные',
		'красного',
		'зелёный',
		'зеленый',
		'зелёная',
		'зелёное',
		'зелёные',
		'зеленого',
		'синий',
		'синяя',
		'синее',
		'синие',
		'синего',
		'голубой',
		'голубая',
		'голубое',
		'голубые',
		'голубого',
		'жёлтый',
		'желтый',
		'жёлтая',
		'жёлтое',
		'жёлтые',
		'желтого',
		'чёрный',
		'черный',
		'чёрная',
		'чёрное',
		'чёрные',
		'черного',
		'белый',
		'белая',
		'белое',
		'белые',
		'белого',
		'серый',
		'серая',
		'серое',
		'серые',
		'серого',
		'фиолетовый',
		'фиолетовая',
		'фиолетовое',
		'фиолетовые',
		'фиолетового',
		'розовый',
		'розовая',
		'розовое',
		'розовые',
		'розового',
		'оранжевый',
		'оранжевая',
		'оранжевое',
		'оранжевые',
		'оранжевого',
		'коричневый',
		'коричневая',
		'коричневое',
		'коричневые',
		'коричневого',
		'бирюзовый',
		'бирюзовая',
		'бирюзовое',
		'бирюзовые',
		'бирюзового',
		'бежевый',
		'бежевая',
		'бежевое',
		'бежевые',
		'бежевого',
		'бордовый',
		'бордовая',
		'бордовое',
		'бордовые',
		'бордового',
		'лазурный',
		'лазурная',
		'лазурное',
		'лазурные',
		'лазурного',
		'салатовый',
		'салатовая',
		'салатовое',
		'салатовые',
		'салатового',
		'сиреневый',
		'сиреневая',
		'сиреневое',
		'сиреневые',
		'сиреневого',
		'лиловый',
		'лиловая',
		'лиловое',
		'лиловые',
		'лилового',
		'золотой',
		'золотая',
		'золотое',
		'золотые',
		'золотого',
		'серебряный',
		'серебряная',
		'серебряное',
		'серебряные',
		'серебряного',
		'хаки',
		'оливковый',
		'оливковая',
		'оливковое',
		'оливковые',
		'оливкового',
		'мятный',
		'мятная',
		'мятное',
		'мятные',
		'мятного',
		'коралловый',
		'коралловая',
		'коралловое',
		'коралловые',
		'кораллового',
		'персиковый',
		'персиковая',
		'персиковое',
		'персиковые',
		'персикового',
		// Китайские
		'红色',
		'绿色',
		'蓝色',
		'黄色',
		'黑色',
		'白色',
		'灰色',
		'紫色',
		'粉色',
		'橙色',
		'棕色',
		'青色',
		'金色',
		'银色'
	]
	// Также учитываем английские названия (basic)
	const englishColorWords = [
		'red',
		'green',
		'blue',
		'yellow',
		'black',
		'white',
		'gray',
		'grey',
		'purple',
		'pink',
		'orange',
		'brown',
		'turquoise',
		'beige',
		'maroon',
		'azure',
		'lime',
		'lavender',
		'violet',
		'gold',
		'silver',
		'khaki',
		'olive',
		'mint',
		'coral',
		'peachpuff',
		'cyan',
		'lightblue'
	]
	// Объединяем все слова в нижнем регистре для сравнения
	const allColorWords = [...colorWords, ...englishColorWords].map(w => w.toLowerCase())
	// Ищем часть, которая является цветом
	for (const part of parts) {
		if (!part) continue
		const lowerPart = part.toLowerCase()
		// Пропускаем размеры и цифры
		const sizeRegex = /^(xs|s|m|l|xl|xxl|xxxl|размер|код|г|g|см|sm|\d)/i
		if (sizeRegex.test(lowerPart)) {
			continue
		}
		// Проверяем, является ли часть цветом
		if (allColorWords.includes(lowerPart)) {
			return part // возвращаем оригинальную часть (с сохранением регистра)
		}
		// Проверяем частичное совпадение (например, "тёмно-синий" содержит "синий")
		for (const colorWord of allColorWords) {
			if (lowerPart.includes(colorWord)) {
				// Возвращаем цветовое слово (оригинальное написание из части)
				// Найдём подстроку в part, соответствующую colorWord (с учётом регистра)
				const idx = lowerPart.indexOf(colorWord)
				if (idx !== -1) {
					return part.substring(idx, idx + colorWord.length)
				}
			}
		}
	}
	// Если цвет не найден, возвращаем первую часть, не являющуюся размером
	for (const part of parts) {
		if (!part) continue
		const lowerPart = part.toLowerCase()
		const sizeRegex = /^(xs|s|m|l|xl|xxl|xxxl|размер|код|г|g|см|sm|\d)/i
		if (!sizeRegex.test(lowerPart)) {
			return part
		}
	}
	// Если все части — размеры, возвращаем пустую строку
	return ''
}
