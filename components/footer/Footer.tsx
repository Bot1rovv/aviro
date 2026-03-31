import Image from 'next/image'
import Link from 'next/link'
import FooterMenu from '../menu/FooterMenu/FooterMenu'

interface FooterProps {
    openTerms?: () => void
}

export default function Footer({ openTerms }: FooterProps) {
    return (
        <footer className="hidden lg:flex flex-col">
            <FooterMenu openTerms={openTerms} />

            <div className="bg-[#0f6b46] flex items-center justify-between gap-6 px-6 py-2 min-h-[72px]">
                <Link href="/" className="shrink-0">
                    <Image
                        width={544}
                        height={207}
                        src="/images/logo-footer.png"
                        alt="Arivoo"
                        className="h-auto w-[150px] object-contain"
                        priority
                    />
                </Link>

                <div className="copyright flex-1 text-center text-white text-sm">
                    Copyright © 2026 Arivoo – All Rights Reserved.
                </div>

                <Image
                    width={768}
                    height={85}
                    src="/images/banks.png"
                    alt="Способы оплаты"
                    className="h-auto max-w-[200px] max-h-[34px] object-contain"
                />
            </div>
        </footer>
    )
}