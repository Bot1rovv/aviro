import { Metadata } from 'next'
import { Phone, Mail, MapPin, Package, Truck, CheckCircle, CreditCard, Warehouse, Shield, Globe } from 'lucide-react'

export const metadata: Metadata = {
	title: 'О компании',
	description: 'О компании Arivoo'
}

const features = [
	{ icon: Globe, text: 'Интегрировали крупные китайские маркетплейсы (1688, Taobao, Poizon) прямо на сайт' },
	{ icon: CreditCard, text: 'Принимаем российские карты — никаких сложностей с оплатой' },
	{ icon: Shield, text: 'AI-алгоритмы подбирают лучшие цены на товары' },
	{ icon: Warehouse, text: 'Принимаем грузы на собственном складе в Китае' },
	{ icon: CheckCircle, text: 'Проверяем качество каждого товара перед отправкой' },
	{ icon: Package, text: 'Профессионально упаковываем для безопасной транспортировки' },
	{ icon: Truck, text: 'Доставляем на склад в Москве и до вашего дома по России' }
]

export default function AboutPage() {
	return (
		<div className="flex items-center justify-center my-5 mt-25">
			<div className="max-w-[980px] w-full px-4">
				{/* Заголовок */}
				<div className="bg-gray-100/70 rounded-xl p-6 mb-6">
					<h1 className="text-black font-semibold text-3xl mb-4">О компании</h1>
					<p className="text-gray-600 text-base">
						Компания работает с 2022 года в сфере грузовых перевозок из Китая в Россию. 
						Мы создали удобную платформу arivoo.ru для беспроблемного доступа к крупным китайским маркетплейсам.
					</p>
				</div>

				{/* Преимущества */}
				<div className="bg-gray-100/70 rounded-xl p-6 mb-6">
					<h2 className="text-black font-semibold text-2xl mb-5">Что мы предлагаем</h2>
					<p className="text-gray-600 mb-5">
						Платформа Arivoo.ru обеспечивает полный цикл от заказа до доставки:
					</p>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{features.map((feature, index) => (
							<div
								key={index}
								className="flex items-start gap-3 p-3 bg-white/50 rounded-lg"
							>
								<feature.icon className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
								<p className="text-gray-600 text-sm">{feature.text}</p>
							</div>
						))}
					</div>
					<p className="text-gray-600 mt-5">
						Клиенты экономят время и деньги, обходя языковые барьеры и ненужных посредников.
					</p>
				</div>

				{/* Контакты */}
				<div className="bg-gray-100/70 rounded-xl p-6 mb-6">
					<h2 className="text-black font-semibold text-2xl mb-5">Контакты</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
							<Phone className="w-5 h-5 text-blue-700 flex-shrink-0" />
							<div>
								<p className="font-semibold text-black text-sm">Телефон</p>
								<a href="tel:+79037402024" className="text-gray-600 text-sm hover:text-blue-700 transition-colors">
									+7 (903) 740-20-24
								</a>
							</div>
						</div>
						<div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
							<Mail className="w-5 h-5 text-blue-700 flex-shrink-0" />
							<div>
								<p className="font-semibold text-black text-sm">E-mail</p>
								<a href="mailto:sales@arivoo.ru" className="text-gray-600 text-sm hover:text-blue-700 transition-colors">
									sales@arivoo.ru
								</a>
							</div>
						</div>
						<div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
							<MapPin className="w-5 h-5 text-blue-700 flex-shrink-0" />
							<div>
								<p className="font-semibold text-black text-sm">Склад в Москве</p>
								<p className="text-gray-600 text-sm">111116, Москва, ул. Лефортовский Вал, 7Г с 5</p>
							</div>
						</div>
						<div className="flex items-start gap-3 p-3 bg-white/50 rounded-lg">
							<MapPin className="w-5 h-5 text-blue-700 flex-shrink-0" />
							<div>
								<p className="font-semibold text-black text-sm">Склад в Москве (пункт выдачи)</p>
								<p className="text-gray-600 text-sm">108821, Москва, Новосередневский пр., 17к1</p>
							</div>
						</div>
					</div>
					<div className="mt-4 p-3 bg-white/50 rounded-lg">
						<div className="flex items-start gap-3">
							<MapPin className="w-5 h-5 text-blue-700 flex-shrink-0" />
							<div>
								<p className="font-semibold text-black text-sm">Склад в Китае</p>
								<p className="text-gray-600 text-sm">
									КНР, Шанхай, район Пудун, проспект Хунань, д. 2218, корп. «Западное здание», помещение 1502
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Реквизиты */}
				<div className="bg-gray-100/70 rounded-xl p-6">
					<h2 className="text-black font-semibold text-2xl mb-5">Реквизиты компании</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div className="space-y-2">
							<p><span className="font-semibold text-black">Наименование:</span> <span className="text-gray-600">ИП Бегишов Адылбек Бегишович</span></p>
							<p><span className="font-semibold text-black">Юридический адрес:</span> <span className="text-gray-600">143923, г. Балашиха, ул. Ситникова, д. 8, кв. 76</span></p>
							<p><span className="font-semibold text-black">ИНН:</span> <span className="text-gray-600">772172351714</span></p>
							<p><span className="font-semibold text-black">ОГРНИП:</span> <span className="text-gray-600">322774600591626</span></p>
						</div>
						<div className="space-y-2">
							<p><span className="font-semibold text-black">Расчётный счёт:</span> <span className="text-gray-600">40802810938720049938</span></p>
							<p><span className="font-semibold text-black">Банк:</span> <span className="text-gray-600">ПАО Сбербанк</span></p>
							<p><span className="font-semibold text-black">БИК:</span> <span className="text-gray-600">044525225</span></p>
							<p><span className="font-semibold text-black">Корсчёт:</span> <span className="text-gray-600">30101810400000000225</span></p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}
