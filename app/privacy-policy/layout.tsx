import { getMetadataForPage } from '@/config/metadata.config'
import { Metadata } from 'next'

export const metadata: Metadata = getMetadataForPage('/privacy-policy')

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
	return <>{children}</>
}
