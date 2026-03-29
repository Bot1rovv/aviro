import Image from 'next/image'
import Link from 'next/link'

export default function HeaderLogo() {
	return (
		<Link href="/">
			<Image
				src="/images/logo-header.png"
				alt="логотип"
				width={390}
				height={120}
				className="max-h-[52px] max-w-[170px]"
				loading="eager"
			/>
		</Link>
	)
}
