import type { Config } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL

const isPostgres = databaseUrl && databaseUrl.startsWith('postgres')

export default {
	schema: './lib/db/schema.ts',
	out: './lib/db/migrations',
	dialect: isPostgres ? 'postgresql' : 'sqlite',
	dbCredentials: isPostgres
		? {
				url: databaseUrl
			}
		: {
				url: './sqlite.db'
			}
} satisfies Config
