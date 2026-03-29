import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function check() {
	try {
		const users = await sql`SELECT COUNT(*) as count FROM "user"`
		console.log('User count:', users[0].count)
		const orders = await sql`SELECT COUNT(*) as count FROM orders`
		console.log('Orders count:', orders[0].count)
		const history = await sql`SELECT COUNT(*) as count FROM user_history`
		console.log('User history count:', history[0].count)
	} catch (error) {
		console.error('Error:', error)
	}
}

check()
