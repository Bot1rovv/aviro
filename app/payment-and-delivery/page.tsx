import { Metadata } from 'next'
import { CreditCard, Truck, Package, RefreshCw, MapPin, Building2 } from 'lucide-react'

export const metadata: Metadata = {
	title: 'Оплата и Доставка',
	description: 'Оплата и Доставка на сайте Arivoo'
}

export default function PaymentPage() {
	return (
		<div className="flex items-center justify-center my-10 mt-25">
			<div className="max-w-[1140px] w-full px-4">
				<h1 className="text-black font-semibold text-3xl mb-8 text-center">Оплата и Доставка</h1>

				{/* Оплата */}
				<section className="mb-10">
					<h2 className="flex items-center gap-2 mb-5 font-semibold text-black text-2xl">
						<CreditCard className="w-6 h-6 text-blue-700" />
						Способы оплаты
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<CreditCard className="w-5 h-5 text-blue-700" />
								Банковской картой
							</h3>
							<p className="text-gray-600 text-sm">
								Оплата банковскими картами Visa, MasterCard, МИР через безопасный платёж. 
								Оплата происходит через платёжный шлюз банка.
							</p>
						</div>

						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<Building2 className="w-5 h-5 text-blue-700" />
								Перевод на счёт
							</h3>
							<p className="text-gray-600 text-sm">
								Перевод на расчётный счёт компании. 
								После оформления заказа менеджер вышлет реквизиты для оплаты.
							</p>
						</div>

						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<Package className="w-5 h-5 text-blue-700" />
								Наложенный платёж
							</h3>
							<p className="text-gray-600 text-sm">
								Оплата при получении заказа в пункте выдачи или курьеру.
							</p>
						</div>

						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<RefreshCw className="w-5 h-5 text-blue-700" />
								Рассрочка и кредит
							</h3>
							<p className="text-gray-600 text-sm">
								Возможность оформить рассрочку или кредит на покупку товаров.
							</p>
						</div>
					</div>
				</section>

				{/* Доставка */}
				<section className="mb-10">
					<h2 className="flex items-center gap-2 mb-5 font-semibold text-black text-2xl">
						<Truck className="w-6 h-6 text-blue-700" />
						Доставка
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Москва */}
						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<MapPin className="w-5 h-5 text-blue-700" />
								Курьерская доставка по Москве
							</h3>
							<ul className="text-gray-600 text-sm space-y-2">
								<li>• Доставка на следующий день после заказа</li>
								<li>• В пределах МКАД: 300 ₽</li>
								<li>• Срочная доставка в день заказа: 1500 ₽</li>
								<li>• За МКАД: 30 ₽/км</li>
								<li>• Время доставки: 10:00 - 21:00</li>
							</ul>
						</div>

						{/* Самовывоз */}
						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<Package className="w-5 h-5 text-blue-700" />
								Самовывоз
							</h3>
							<ul className="text-gray-600 text-sm space-y-2">
								<li>• Бесплатно</li>
								<li>• Москва, Каширское шоссе, д. 19 корп. 2</li>
								<li>• Рынок «Каширский двор 1»</li>
								<li>• Цокольный этаж, павильон 57</li>
							</ul>
						</div>

						{/* По России */}
						<div className="bg-gray-100/70 rounded-xl p-5">
							<h3 className="flex items-center gap-2 mb-3 font-semibold text-black text-lg">
								<Truck className="w-5 h-5 text-blue-700" />
								Доставка по России
							</h3>
							<ul className="text-gray-600 text-sm space-y-2">
								<li>• Бесплатно от 4500 ₽</li>
								<li>• До ТК в Москве</li>
								<li>• ТК: СДЭК, Деловые Линии, ПЭК</li>
								<li>• Отправка после 100% оплаты</li>
							</ul>
						</div>
					</div>
				</section>

				{/* Гарантии */}
				<section>
					<h2 className="flex items-center gap-2 mb-5 font-semibold text-black text-2xl">
						<RefreshCw className="w-6 h-6 text-blue-700" />
						Гарантии и возврат
					</h2>

					<div className="bg-gray-100/70 rounded-xl p-5">
						<p className="text-gray-600 text-sm mb-4">
							Компания Arivoo дорожит своей репутацией и сотрудничает только с проверенными поставщиками. 
							Мы гарантируем качество всех товаров и предоставляем официальную гарантию.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h4 className="font-semibold text-black mb-2">Гарантия качества</h4>
								<p className="text-gray-600 text-sm">
									Каждый товар проходит проверку качества на складе в Китае с фото- и видеоотчётом.
								</p>
							</div>
							<div>
								<h4 className="font-semibold text-black mb-2">Возврат товара</h4>
								<p className="text-gray-600 text-sm">
									Возврат возможен до отправки товара. При получении — по согласованию с менеджером.
								</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	)
}
