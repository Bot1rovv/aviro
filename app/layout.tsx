import { baseMetadata } from '@/config/metadata.config'
import AppLayout from '@/layouts/AppLayout'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Nunito } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

const nunito = Nunito({
	variable: '--font-nunito',
	subsets: ['latin', 'cyrillic'],
	weight: ['400', '500', '600', '700']
})

export const viewport = {
	themeColor: '#007bff',
	width: 'device-width',
	initialScale: 1
}
export const metadata: Metadata = baseMetadata

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ru">
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}
				suppressHydrationWarning
			>
				<AppLayout>{children}</AppLayout>
			</body>
		</html>
	)
}
