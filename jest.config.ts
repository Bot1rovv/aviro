import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files
	dir: './'
})

// Add any custom config to be passed to Jest
const config: Config = {
	coverageProvider: 'v8',
	testEnvironment: 'jsdom',
	// Add more setup options before each test is run
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	// Module name mappings
	moduleNameMapper: {
		// Handle module aliases (if you are using them in your Next.js project)
		'^@/(.*)$': '<rootDir>/$1'
	},
	// Collect coverage from these files
	collectCoverageFrom: [
		'**/*.{js,jsx,ts,tsx}',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/.next/**',
		'!**/coverage/**',
		'!**/jest.config.*',
		'!**/jest.setup.*'
	],
	// Ignore certain paths
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
	// Transform files with ts-jest
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest'
	}
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
