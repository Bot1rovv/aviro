import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { join } from 'path'

// Используем UNPOOLED URL, если доступен, иначе обычный
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function runMigration() {
	try {
		const sqlPath = join(process.cwd(), 'scripts', 'create-tables-neon-v2.sql')
		const sqlContent = readFileSync(sqlPath, 'utf8')
		const statements = sqlContent
			.split(';')
			.map(s => s.trim())
			.filter(s => s.length > 0)

		console.log(`Executing ${statements.length} SQL statements...`)
		for (let i = 0; i < statements.length; i++) {
			const stmt = statements[i]
			console.log(`[${i + 1}/${statements.length}] Executing: ${stmt.substring(0, 80)}...`)
			// Используем sql.query для запросов без параметров
			await sql.query(stmt)
		}
		console.log('Migration completed successfully.')
	} catch (error) {
		console.error('Migration failed:', error)
		process.exit(1)
	}
}

runMigration()
