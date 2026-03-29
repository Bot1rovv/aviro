import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function cleanDatabase() {
	try {
		// Отключаем триггеры для каскадного удаления (если нужно)
		// Удаляем данные в правильном порядке из-за foreign keys
		const tables = ['verification', 'account', 'session', 'orders', 'user_history', 'user']

		for (const table of tables) {
			const query = `TRUNCATE TABLE "${table}" CASCADE`
			console.log(`Cleaning table: ${table}`)
			await sql.query(query)
		}

		console.log('All tables cleaned successfully.')
	} catch (error) {
		console.error('Error cleaning database:', error)
		process.exit(1)
	}
}

cleanDatabase()
