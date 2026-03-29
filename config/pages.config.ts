export class PagesConfig {
	// Основные страницы
	static readonly HOME = '/'
	static readonly CATALOG = '/products' // перенаправлено на /products
	static readonly USER = '/user'
	static readonly FAQ = '/faq'
	static readonly ABOUT_US = '/about-us'
	static readonly PAYMENT_AND_DELIVERY = '/payment-and-delivery'
	static readonly TERMS_OF_USE = '/terms-of-use'
	static readonly PRIVACY_POLICY = '/privacy-policy'
	static readonly LOGIN = '/login'
	static readonly REGISTRATION = '/registration'
	static readonly FAVORITES = '/favorites'
	static readonly CART = '/cart'

	// Страницы товаров
	static readonly PRODUCTS_BY_CATEGORY = '/category'
	static readonly PRODUCTS_BY_BRAND = '/brand'
	static readonly PRODUCTS_BY_SEARCH = '/search'
	static PRODUCT_DETAILS(slug: string) {
		return `/product/${slug}`
	}

	// Категории (используются в меню)
	static readonly ALL_PRODUCTS = '/products'
	static readonly ELECTRONICS = '/electronics'
	static readonly FURNITURE = '/furniture'
	static readonly CONSTRUCTION_AND_REPAIR = '/construction-and-repair'
	static readonly PHARMACY = '/pharmacy'
	static readonly HOUSEHOLD_CHEMICALS = '/household-chemicals'
	static readonly CHILDREN_PRODUCTS = '/children-products'
	static readonly FOR_ANIMALS = '/for-animals'
	static readonly HOME_AND_GARDEN = '/home-and-garden'
	static readonly GAMES_AND_CONSOLES = '/games-and-consoles'
	static readonly BOOKS = '/books'
	static readonly STATIONERY = '/stationery'
	static readonly BEAUTY_AND_HEALTH = '/beauty-and-health'
	static readonly KITCHEN = '/kitchen'
	static readonly SHOES = '/shoes'
	static readonly CLOTHES = '/clothes'
	static readonly LIGHTING = '/lighting'
	static readonly SPORTS_AND_RECREATION = '/sports-and-recreation'
	static readonly LAPTOP_TABLET_EBOOKS = '/laptops-tablets-ebooks'
	static readonly ACCESSORIES_FOR_SMART_WATCHES = '/accessories-for-smart-watches'
	static readonly MOBILE_PHONES = '/mobile-phones'
	static readonly WIRED_AND_WIRELESS_TELEPHONES = '/wired-and-wireless-telephones'
	static readonly SMARTPHONES = '/smartphones'

	// Подкатегории телефонов и смарт-часов
	static readonly ACCESSORIES_FOR_SMARTWATCHES = '/accessories-for-smartwatches'
	static readonly ACCESSORIES_FOR_SMARTPHONES = '/accessories-for-smartphones'
	static readonly SMARTWATCHES = '/smartwatches'
	static readonly SMARTWATCH_STRAPS = '/smartwatch-straps'
	static readonly FITNESS_BRACELETS = '/fitness-bracelets'

	// Компьютеры и периферия
	static readonly MICROCOMPUTERS_AND_COMPONENTS = '/microcomputers-and-components'
	static readonly PERIPHERALS = '/peripherals'
	static readonly SOFTWARE = '/software'
	static readonly NETWORK_EQUIPMENT = '/network-equipment'
	static readonly SYSTEM_BLOCKS = '/system-blocks'
	static readonly MONITORS = '/monitors'
	static readonly MONOBLOCKS = '/monoblocks'
	static readonly MONITOR_PARTS = '/monitor-parts'
}
