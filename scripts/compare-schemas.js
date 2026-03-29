import { neon } from '@neondatabase/serverless'
import sqlite3 from 'better-sqlite3'
import 'dotenv/config'

async function compare() {
	// Neon
	const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
	if (!databaseUrl) {
		console.error('DATABASE_URL environment variable is required')
		process.exit(1)
	}
	const sql = neon(databaseUrl)

	// SQLite
	const db = sqlite3('./sqlite.db')

	// Получить список таблиц в Neon
	const neonTables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
	const neonTableNames = neonTables.map(t => t.table_name).sort()

	// Получить список таблиц в SQLite
	const sqliteTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
	const sqliteTableNames = sqliteTables.map(t => t.name).sort()

	console.log('Neon tables:', neonTableNames)
	console.log('SQLite tables:', sqliteTableNames)

	// Сравнить
	const setNeon = new Set(neonTableNames)
	const setSqlite = new Set(sqliteTableNames)
	const extraInNeon = neonTableNames.filter(t => !setSqlite.has(t))
	const extraInSqlite = sqliteTableNames.filter(t => !setNeon.has(t))

	if (extraInNeon.length > 0) {
		console.log('Tables only in Neon:', extraInNeon)
	}
	if (extraInSqlite.length > 0) {
		console.log('Tables only in SQLite:', extraInSqlite)
	}
	if (extraInNeon.length === 0 && extraInSqlite.length === 0) {
		console.log('Table lists are identical.')
	}

	// Сравнить структуру каждой таблицы
	for (const tableName of neonTableNames) {
		if (tableName === '__drizzle_migrations') continue
		console.log(`\n=== Table ${tableName} ===`)
		// Neon columns
		const neonColumns = await sql`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = ${tableName}
			ORDER BY ordinal_position
		`
		// SQLite columns
		const sqliteColumns = db.prepare(`PRAGMA table_info(${tableName})`).all()
		const sqliteColMap = sqliteColumns.reduce((acc, col) => {
			acc[col.name] = { type: col.type, notnull: col.notnull }
			return acc
		}, {})

		console.log(
			'Neon columns:',
			neonColumns.map(c => `${c.column_name} ${c.data_type} ${c.is_nullable}`)
		)
		console.log(
			'SQLite columns:',
			sqliteColumns.map(c => `${c.name} ${c.type} ${c.notnull ? 'NOT NULL' : 'NULL'}`)
		)

		// Простое сравнение количества колонок
		if (neonColumns.length !== sqliteColumns.length) {
			console.log(`Column count mismatch: Neon ${neonColumns.length}, SQLite ${sqliteColumns.length}`)
		}
	}

	db.close()
}

compare().catch(console.error)
