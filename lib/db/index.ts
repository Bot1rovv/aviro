const databaseUrl = process.env.DATABASE_URL

// Определяем, какой драйвер использовать
let db: unknown
if (databaseUrl && databaseUrl.startsWith('postgres')) {
	// Используем Neon
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { db: neonDb } = require('./neon')
	db = neonDb
} else {
	// Используем SQLite
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const { db: sqliteDb } = require('./sqlite')
	db = sqliteDb
}

// Импортируем тип db из sqlite (оба имеют одинаковую структуру)
import type { db as sqliteDbType } from './sqlite'
type DbType = typeof sqliteDbType

const typedDb = db as DbType

export { typedDb as db }
export type Database = typeof typedDb
