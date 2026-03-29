import { neon } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!databaseUrl) {
	console.error('DATABASE_URL environment variable is required')
	process.exit(1)
}

const sql = neon(databaseUrl)

async function checkConfig() {
	console.log('Checking production configuration...')
	console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
	console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
	console.log('DATABASE_URL:', databaseUrl.substring(0, 30) + '...')

	// Проверим, что таблица user существует и можем вставить тестовую запись (удалим после)
	try {
		const testId = 'test-' + Date.now()
		const now = Date.now()
		const insert = await sql`
			INSERT INTO "user" (id, email, email_verified, created_at, updated_at)
			VALUES (${testId}, ${'test@example.com'}, false, ${now}, ${now})
			RETURNING id
		`
		console.log('Test insert successful:', insert)

		// Удаляем тестовую запись
		await sql`DELETE FROM "user" WHERE id = ${testId}`
		console.log('Test record cleaned up.')
	} catch (error) {
		console.error('Error inserting test record:', error)
	}
}

checkConfig()
