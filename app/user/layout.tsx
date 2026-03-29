import { getMetadataForPage } from '@/config/metadata.config'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = getMetadataForPage('/user')

export default function UserLayout({ children }: { children: React.ReactNode }) {
	return <Suspense fallback={null}>{children}</Suspense>
}
