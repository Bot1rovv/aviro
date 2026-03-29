import Image from 'next/image'
import Link from 'next/link'

export default function FooterLogo() {
	return (
		<Link href="/">
			<Image
				src="/images/logo-footer.png"
				alt="логотип футера"
				width={390}
				height={120}
				className="max-h-9 max-w-32"
			/>
		</Link>
	)
}
