import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function checkTables() {
	try {
		// Получить список таблиц
		const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
		console.log('Tables in database:')
		console.log(tables.map(t => t.table_name).join(', '))

		// Проверить структуру таблицы user
		const userColumns = await sql`
			SELECT column_name, data_type, is_nullable
			FROM information_schema.columns
			WHERE table_name = 'user'
			ORDER BY ordinal_position
		`
		console.log('\nColumns in "user" table:')
		userColumns.forEach(col => {
			console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
		})

		// Проверить несколько записей
		const sample = await sql`SELECT id, email FROM "user" LIMIT 5`
		console.log('\nSample users:', sample)
	} catch (error) {
		console.error('Error checking tables:', error)
	}
}

checkTables()
