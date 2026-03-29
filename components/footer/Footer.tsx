import Image from 'next/image'
import FooterLogo from '../logo/FooterLogo'
import FooterMenu from '../menu/FooterMenu/FooterMenu'

interface FooterProps {
	openTerms?: () => void
}

export default function Footer({ openTerms }: FooterProps) {
	return (
		<footer className="hidden lg:flex flex-col ">
			<FooterMenu openTerms={openTerms} />
			<div className="bg-blue-700 flex items-center justify-between py-1.5 max-h-16">
				<FooterLogo />
				<div className="copyright text-white text-sm">Copyright © 2026 Arivoo – All Rights Reserved.</div>
				<Image
					width={768}
					height={85}
					src="/images/banks.png"
					alt="logo"
					className="max-w-[200px] max-h-[34px]"
				/>
			</div>
		</footer>
	)
}
