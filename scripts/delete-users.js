import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function deleteUsers() {
	try {
		// Удаляем все записи из таблиц, зависящих от user (в правильном порядке)
		await sql.query('DELETE FROM verification')
		await sql.query('DELETE FROM account')
		await sql.query('DELETE FROM session')
		await sql.query('DELETE FROM orders')
		await sql.query('DELETE FROM user_history')
		await sql.query('DELETE FROM "user"')

		console.log('All users and related data deleted.')
	} catch (error) {
		console.error('Error deleting users:', error)
		process.exit(1)
	}
}

deleteUsers()
