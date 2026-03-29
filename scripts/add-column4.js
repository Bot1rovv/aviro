const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') })
const { neon } = require('@neondatabase/serverless')

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function addColumn() {
	try {
		await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;`
		console.log('Column customer_email added or already exists')
	} catch (err) {
		console.error('Error adding column:', err)
	}
}

addColumn()
