import Image from 'next/image'
import Link from 'next/link'

export default function NotFound() {
	return (
		<div className="container flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
			<Image
				src="/images/404.png"
				alt="404 - Страница не найдена"
				width={400}
				height={300}
				className="mb-8"
				priority
			/>
			<h1 className="text-4xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
			<p className="text-gray-600 mb-8 max-w-md">К сожалению, запрашиваемая страница не существует. Возможно, она была удалена или перемещена.</p>
			<div className="flex flex-col sm:flex-row gap-4">
				<Link
					href="/"
					className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
				>
					Вернуться на главную
				</Link>
				<Link
					href="/products"
					className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
				>
					Перейти в каталог
				</Link>
			</div>
		</div>
	)
}
