/**
 * Словарь переводов для товаров с Poizon, 1688 и Taobao.
 * Ключи могут быть на английском, китайском или других языках.
 * Значения - на русском.
 */

export const translationDict: Record<string, string> = {
	// Цвета (Colors)
	Red: 'Красный',
	Green: 'Зеленый',
	Blue: 'Синий',
	Yellow: 'Желтый',
	Black: 'Черный',
	White: 'Белый',
	Gray: 'Серый',
	Purple: 'Фиолетовый',
	Pink: 'Розовый',
	Orange: 'Оранжевый',
	Brown: 'Коричневый',
	Cyan: 'Голубой',
	Magenta: 'Пурпурный',
	Lime: 'Лаймовый',
	Maroon: 'Бордовый',
	Navy: 'Темно-синий',
	Olive: 'Оливковый',
	Teal: 'Бирюзовый',
	Silver: 'Серебряный',
	Gold: 'Золотой',
	Beige: 'Бежевый',
	Coral: 'Коралловый',
	Salmon: 'Лососевый',
	Khaki: 'Хаки',
	Indigo: 'Индиго',
	Violet: 'Фиолетовый',
	Plum: 'Сливовый',
	Tan: 'Загорелый',
	Mint: 'Мятный',
	Cream: 'Кремовый',
	Charcoal: 'Угольный',
	Olivedrab: 'Оливково-зеленый',

	// Материалы (Materials)
	Cotton: 'Хлопок',
	Polyester: 'Полиэстер',
	Wool: 'Шерсть',
	Silk: 'Шелк',
	Leather: 'Кожа',
	Suede: 'Замша',
	Denim: 'Джинс',
	Linen: 'Лен',
	Nylon: 'Нейлон',
	Spandex: 'Спандекс',
	Rayon: 'Вискоза',
	Cashmere: 'Кашемир',
	Velvet: 'Бархат',
	Fur: 'Мех',
	Rubber: 'Резина',
	Plastic: 'Пластик',
	Metal: 'Металл',
	Wood: 'Дерево',
	Glass: 'Стекло',
	Ceramic: 'Керамика',
	Stone: 'Камень',
	Marble: 'Мрамор',
	Granite: 'Гранит',

	// Бренды (Brands) - общие
	Nike: 'Найк',
	Adidas: 'Адидас',
	Puma: 'Пума',
	Gucci: 'Гуччи',
	'Louis Vuitton': 'Луи Виттон',
	Chanel: 'Шанель',
	Apple: 'Эппл',
	Samsung: 'Самсунг',
	Sony: 'Сони',
	Xiaomi: 'Сяоми',
	Huawei: 'Хуавей',
	Lenovo: 'Леново',
	Dell: 'Делл',
	HP: 'Хьюлетт-Паккард',
	Canon: 'Кэнон',
	Nikon: 'Никон',
	Zara: 'Зара',
	'H&M': 'Х&М',
	Uniqlo: 'Юникло',
	Lacoste: 'Лакост',
	'Ralph Lauren': 'Ральф Лорен',
	'Calvin Klein': 'Кельвин Кляйн',
	'Tommy Hilfiger': 'Томми Хилфигер',
	'Under Armour': 'Андер Армор',
	'New Balance': 'Нью Баланс',
	Converse: 'Конверс',
	Vans: 'Ванс',
	Jordan: 'Джордан',
	Reebok: 'Рибок',
	Fila: 'Фила',

	// Категории (Categories) - общие
	Shoes: 'Обувь',
	Clothing: 'Одежда',
	Electronics: 'Электроника',
	'Home Appliances': 'Бытовая техника',
	Sports: 'Спорт',
	Beauty: 'Красота',
	Toys: 'Игрушки',
	Furniture: 'Мебель',
	Jewelry: 'Украшения',
	Watches: 'Часы',
	Bags: 'Сумки',
	Accessories: 'Аксессуары',
	Automotive: 'Автотовары',
	Tools: 'Инструменты',
	Food: 'Еда',
	Drinks: 'Напитки',
	Health: 'Здоровье',
	Baby: 'Детские товары',
	Pet: 'Товары для животных',
	Office: 'Офис',

	// Размеры (Sizes) - общие
	XS: 'XS',
	S: 'S',
	M: 'M',
	L: 'L',
	XL: 'XL',
	XXL: 'XXL',
	XXXL: 'XXXL',
	'One Size': 'Один размер',
	'Free Size': 'Свободный размер',

	// Единицы измерения (Units)
	cm: 'см',
	inch: 'дюйм',
	kg: 'кг',
	g: 'г',
	lb: 'фунт',
	oz: 'унция',
	ml: 'мл',
	Liter: 'л',
	piece: 'шт',
	pair: 'пара',
	set: 'набор',
	pack: 'упаковка',

	// Характеристики (Specification keys)
	Brand: 'Бренд',
	Model: 'Модель',
	Color: 'Цвет',
	Size: 'Размер',
	Material: 'Материал',
	Weight: 'Вес',
	Dimensions: 'Габариты',
	Length: 'Длина',
	Width: 'Ширина',
	Height: 'Высота',
	Diameter: 'Диаметр',
	Capacity: 'Емкость',
	Power: 'Мощность',
	Voltage: 'Напряжение',
	Battery: 'Батарея',
	Warranty: 'Гарантия',
	Origin: 'Страна происхождения',
	Manufacturer: 'Производитель',
	Style: 'Стиль',
	Season: 'Сезон',
	Gender: 'Пол',
	Age: 'Возраст',
	Type: 'Тип',
	Category: 'Категория',
	Subcategory: 'Подкатегория',
	Feature: 'Особенность',
	Function: 'Функция',
	Usage: 'Применение',
	Care: 'Уход',
	Package: 'Упаковка',
	Quantity: 'Количество',
	Stock: 'Наличие',
	Sales: 'Продажи',
	Rating: 'Рейтинг',

	// Китайские термины (часто встречающиеся)
	颜色: 'Цвет',
	尺码: 'Размер',
	材质: 'Материал',
	品牌: 'Бренд',
	型号: 'Модель',
	重量: 'Вес',
	尺寸: 'Габариты',
	长度: 'Длина',
	宽度: 'Ширина',
	高度: 'Высота',
	直径: 'Диаметр',
	容量: 'Емкость',
	功率: 'Мощность',
	电压: 'Напряжение',
	电池: 'Батарея',
	保修: 'Гарантия',
	产地: 'Страна происхождения',
	制造商: 'Производитель',
	风格: 'Стиль',
	季节: 'Сезон',
	性别: 'Пол',
	年龄: 'Возраст',
	类型: 'Тип',
	分类: 'Категория',
	子分类: 'Подкатегория',
	特点: 'Особенность',
	功能: 'Функция',
	用途: 'Применение',
	保养: 'Уход',
	包装: 'Упаковка',
	数量: 'Количество',
	库存: 'Наличие',
	销量: 'Продажи',
	评分: 'Рейтинг',

	// Английские термины из Poizon
	distBrandName: 'Бренд',
	distSpuTitle: 'Название товара',
	dwSpuTitle: 'Название товара (кит.)',
	authPrice: 'Цена',
	originalPrice: 'Оригинальная цена',
	sales: 'Продажи',
	description: 'Описание',
	productDesc: 'Описание товара',
	skuList: 'Варианты',
	saleAttr: 'Атрибуты продажи',
	enName: 'Название (англ.)',
	cnName: 'Название (кит.)',
	enValue: 'Значение (англ.)',
	cnValue: 'Значение (кит.)',
	distCategoryl1Name: 'Категория 1',
	distCategoryl2Name: 'Категория 2',
	distCategoryl3Name: 'Категория 3',
	distFitPeopleName: 'Подходит для',
	material: 'Материал',
	season: 'Сезон',
	dwDesignerId: 'ID дизайнера',

	// Общие фразы
	'In stock': 'В наличии',
	'Out of stock': 'Нет в наличии',
	'Limited stock': 'Ограниченное количество',
	'Pre-order': 'Предзаказ',
	'New arrival': 'Новинка',
	'Best seller': 'Бестселлер',
	Discount: 'Скидка',
	Sale: 'Распродажа',
	'Free shipping': 'Бесплатная доставка',
	'Fast delivery': 'Быстрая доставка',
	'Quality guarantee': 'Гарантия качества',
	'Customer reviews': 'Отзывы покупателей',
	'Return policy': 'Политика возврата',
	'Warranty included': 'Гарантия включена',
	Authentic: 'Оригинал',
	Replica: 'Реплика',
	Genuine: 'Подлинный',
	Fake: 'Подделка',

	// Дополнительные термины
	'Style ID': 'ID стиля',
	Waterproof: 'Водонепроницаемый',
	Breathable: 'Дышащий',
	Lightweight: 'Лёгкий',
	Durable: 'Прочный',
	'Eco-friendly': 'Экологичный',
	Organic: 'Органический',
	Hypoallergenic: 'Гипоаллергенный',
	'Machine washable': 'Можно стирать в машине',
	'Hand wash only': 'Только ручная стирка',
	Imported: 'Импортный',
	Domestic: 'Отечественный',
	Unisex: 'Унисекс',
	"Men's": 'Мужской',
	"Women's": 'Женский',
	Kids: 'Детский',
	Adult: 'Взрослый',
	New: 'Новый',
	Used: 'Б/у',
	Refurbished: 'Восстановленный',
	'Like New': 'Как новый',
	'Open Box': 'Распакованный',
	Express: 'Экспресс',
	Standard: 'Стандартный',
	US: 'США',
	EU: 'ЕС',
	UK: 'Великобритания',
	CN: 'Китай',
	'US Size': 'Размер США',
	'EU Size': 'Размер ЕС',
	'UK Size': 'Размер Великобритании',
	'CN Size': 'Размер Китая',
	Comfortable: 'Удобный',
	Fashion: 'Мода',
	Trendy: 'Модный',
	Classic: 'Классический',
	Modern: 'Современный',
	Vintage: 'Винтажный'
}

/**
 * Функция перевода строки с использованием словаря.
 * Если перевод не найден, возвращает исходную строку.
 * @param text - текст для перевода
 * @param lang - исходный язык (опционально)
 */
export function translate(text: string): string {
	if (!text || typeof text !== 'string') return text
	const trimmed = text.trim()
	// Прямое совпадение
	if (translationDict[trimmed]) {
		return translationDict[trimmed]
	}
	// Попробуем найти совпадение без учета регистра
	const lower = trimmed.toLowerCase()
	const foundKey = Object.keys(translationDict).find(key => key.toLowerCase() === lower)
	if (foundKey) {
		return translationDict[foundKey]
	}
	// Если текст содержит несколько слов, можно попробовать перевести каждое слово
	// но для простоты оставим как есть
	return text
}

/**
 * Функция перевода объекта спецификаций (ключ-значение).
 * @param specs - объект спецификаций
 */
export function translateSpecifications(specs: Record<string, string>): Record<string, string> {
	const translated: Record<string, string> = {}
	for (const [key, value] of Object.entries(specs)) {
		const translatedKey = translate(key)
		const translatedValue = translate(value)
		translated[translatedKey] = translatedValue
	}
	return translated
}

/**
 * Функция перевода массива строк.
 */
export function translateArray(texts: string[]): string[] {
	return texts.map(translate)
}
