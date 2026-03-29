import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// Пользователь
export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name'),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
	password: text('password'),
	phone: text('phone'),
	addressData: text('address_data'), // JSON с адресом: {lastName, patronymic, city, address, addressExtra}
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// История действий пользователя
export const userHistory = sqliteTable('user_history', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	action: text('action').notNull(), // 'view_product', 'add_to_favorites', 'remove_from_favorites', 'add_to_cart', 'remove_from_cart', 'create_order'
	productId: text('product_id'),
	productTitle: text('product_title'),
	productPrice: text('product_price'),
	productImage: text('product_image'),
	details: text('details'), // дополнительные детали (например, причина отмены заказа)
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// Заказы
export const order = sqliteTable('orders', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	status: text('status').notNull().default('pending'), // 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
	total: text('total').notNull(),
	items: text('items').notNull(), // JSON массив товаров
	customerEmail: text('customer_email'), // Email покупателя для отправки чека
	trackingNumber: text('tracking_number'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// Сессия
export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
})

// Аккаунт (OAuth)
export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
})

// Верификация
export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})

// Сессия поиска по изображению
export const imageSearchSession = sqliteTable('image_search_session', {
	id: text('id').primaryKey(),
	results: text('results').notNull(), // JSON массив ProductItem
	imageIds: text('image_ids'), // JSON объект { '1688'?: string, taobao?: string }
	sources: text('sources').notNull(), // JSON массив ('1688' | 'taobao')[]
	pageSize: integer('page_size').notNull(),
	currentPage: integer('current_page').notNull(),
	totalPages: integer('total_pages'),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
})
