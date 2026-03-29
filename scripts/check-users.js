import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function check() {
	try {
		const result = await sql`SELECT COUNT(*) as count FROM "user"`
		console.log('Users count:', result[0].count)
	} catch (error) {
		console.error('Error:', error)
	}
}

check()
