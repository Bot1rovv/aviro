import { ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../ui/Button/Button'

export default function FavItem() {
	return (
		<div>
			<div
				className="grid grid-cols-3 items-center gap-4 relative"
				id="fav-item"
			>
				{/* Улучшить, уьрать абсолют и поставить флексом куда надо в блоке item-description, как cartItem */}
				<Button
					variant="danger"
					size="sm"
					className="absolute right-0 top-0 p-1"
					aria-label="Удалить из избранного"
				>
					<X size={14} />
				</Button>
				<Link
					className="flex items-center justify-center w-full h-full"
					href="/product/productid"
				>
					<Image
						src="/images/product.webp"
						alt="картинка товара"
						width={300}
						height={300}
						style={{ width: '100%', height: '100%', display: 'block' }}
					/>
				</Link>
				<div
					className="col-span-2"
					id="item-description"
				>
					<h3
						id="item-title"
						className="font-semibold text-black text-lg mb-2.5 text-start"
					>
						Название товара
					</h3>
					<div className="w-full flex flex-col items-start gap-2.5">
						<div className="item-price flex items-center justify-between w-full gap-5">
							<span className="text-xs font-bold text-gray-800">Цена:</span>
							<span
								id="item-price"
								className="text-red-600 font-semibold text-sm"
							>
								902.34 ₽
							</span>
						</div>
						<div className="in-stock flex items-center justify-between w-full gap-5">
							<span className="text-xs font-bold text-gray-800">В наличии:</span>
							<span
								id="in-stock"
								className="text-black font-semibold text-sm"
							>
								В наличии
							</span>
						</div>
						<Button
							variant="primary"
							className="mt-4 w-full flex-shrink-0 flex items-center justify-center  gap-2.5"
						>
							<ShoppingBag />
							<span>В корзину</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
