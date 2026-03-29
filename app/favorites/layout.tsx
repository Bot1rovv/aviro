import { getMetadataForPage } from '@/config/metadata.config'
import { Metadata } from 'next'

export const metadata: Metadata = getMetadataForPage('/favorites')

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
