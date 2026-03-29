'use client'

import { PagesConfig } from '@/config/pages.config'
import { useTermsModalStore } from '@/lib/store/terms-modal'
import Link from 'next/link'

const PrivacyData = [
	{
		title: '1. Оператор персональных данных',
		description: 'Оператор: ИП Бегишов Адылбек Бегишович, ИНН 772172351714, ОГРНИП 322774600591626',
		subDescription: 'Юридический адрес: 143923, г. Балашиха, ул. Ситникова, д. 8, кв. 76.'
	},
	{
		title: '2. Какие данные мы собираем',
		description:
			'Мы можем обрабатывать: ФИО, номер телефона, адрес электронной почты, адрес доставки, сведения о заказах и оплате, переписку с поддержкой, технические данные (IP-адрес, cookies, тип устройства и браузера, данные сессии).'
	},
	{
		title: '3. Цели обработки данных',
		list: [
			'регистрация и обслуживание аккаунта пользователя;',
			'оформление, оплата, доставка и возврат заказов;',
			'связь с пользователем по заказу и обращениям;',
			'повышение качества сервиса, безопасность и предотвращение мошенничества;',
			'исполнение требований законодательства РФ.'
		]
	},
	{
		title: '4. Правовые основания обработки',
		description:
			'Обработка осуществляется на основании согласия пользователя, заключения и исполнения договора (оферты), а также требований действующего законодательства Российской Федерации.'
	},
	{
		title: '5. Передача данных третьим лицам',
		description:
			'Данные могут передаваться платежным, логистическим, техническим и иным подрядчикам только в объеме, необходимом для выполнения заказа и работы сервиса. Мы не продаем персональные данные третьим лицам.'
	},
	{
		title: '6. Сроки хранения данных',
		description:
			'Данные хранятся не дольше, чем это необходимо для целей обработки, либо в сроки, установленные законодательством РФ и обязательствами по документообороту.'
	},
	{
		title: '7. Права пользователя',
		description:
			'Пользователь вправе запросить доступ к своим данным, их уточнение, ограничение обработки или удаление, а также отозвать согласие на обработку, если иное не требуется законом.'
	},
	{
		title: '8. Cookies и аналитика',
		description:
			'Сайт использует cookies для авторизации, сохранения настроек, корректной работы корзины и аналитики. Пользователь может изменить настройки cookies в браузере, однако часть функций сайта может работать ограниченно.'
	},
	{
		title: '9. Защита данных',
		description:
			'Мы применяем организационные и технические меры защиты от несанкционированного доступа, утраты, изменения и распространения персональных данных.'
	},
	{
		title: '10. Контакты по вопросам персональных данных',
		links: [
			{ text: '+7(903)740-20-24', href: 'tel:+79037402024' },
			{ text: 'sales@arivoo.ru', href: 'mailto:sales@arivoo.ru' },
			{ text: 'https://t.me/arivoooo', href: 'https://t.me/arivoooo' }
		],
		related: 'Связанные документы: Публичная оферта, Оплата и возвраты.'
	}
]

export default function PrivacyPage() {
	const { open: openTerms } = useTermsModalStore()

	const handleTermsClick = (e: React.MouseEvent) => {
		e.preventDefault()
		openTerms()
	}

	return (
		<div className="min-h-screen bg-white lg:mt-[-40px]">
			<div className="flex flex-col items-center px-4 py-5 lg:py-25">
				<div className="w-full max-w-4xl bg-gray-100/70 rounded-xl px-4 py-5 text-sm text-gray-600">
					<h1 className="text-black font-semibold text-lg mb-5 lg:text-3xl">Политика конфиденциальности Arivoo</h1>
					<p className="mb-2">
						<span className="font-bold">Редакция от 27 февраля 2026 года.</span> Настоящая политика определяет порядок обработки и защиты персональных
						данных пользователей сайта Arivoo.
					</p>

					{PrivacyData.map((item, index) => (
						<div key={index}>
							<h2 className="font-bold text-black text-base mt-5 lg:text-xl">{item.title}</h2>

							{item.description && <p className="my-2.5 text-sm leading-relaxed break-words">{item.description}</p>}
							{item.subDescription && <p className="my-2.5 text-sm leading-relaxed break-words">{item.subDescription}</p>}

							{item.list && (
								<ul className="list-disc list-inside my-2.5 space-y-1">
									{item.list.map((li, i) => (
										<li
											key={i}
											className="text-sm leading-relaxed break-words"
										>
											{li}
										</li>
									))}
								</ul>
							)}

							{item.links && (
								<div className="my-2.5 space-y-2">
									<p className="text-sm">
										Телефон:{' '}
										<Link
											className="underline transition-colors duration-300 hover:text-amber-600 break-all"
											href={item.links[0].href}
										>
											{item.links[0].text}
										</Link>
									</p>
									<p className="text-sm">
										E-mail:{' '}
										<Link
											className="underline transition-colors duration-300 hover:text-amber-600 break-all"
											href={item.links[1].href}
										>
											{item.links[1].text}
										</Link>
									</p>
									<p className="text-sm">
										Telegram:{' '}
										<Link
											className="underline transition-colors duration-300 hover:text-amber-600 break-all"
											href={item.links[2].href}
											target="_blank"
											rel="noopener noreferrer"
										>
											{item.links[2].text}
										</Link>
									</p>
									<p className="text-gray-700 text-sm">
										Связанные документы:{' '}
										<button
											onClick={handleTermsClick}
											className="underline transition-colors duration-300 hover:text-amber-600"
										>
											Публичная оферта
										</button>
										,{' '}
										<Link
											href={PagesConfig.PAYMENT_AND_DELIVERY}
											className="underline transition-colors duration-300 hover:text-amber-600"
										>
											Оплата и возвраты
										</Link>
										.
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
