'use client'

import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
	question: string
	answer: string
}

interface FAQClientProps {
	faqData: FAQItem[]
}

export default function FAQClient({ faqData }: FAQClientProps) {
	const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set())

	const toggle = (index: number) => {
		setOpenIndexes(prev => {
			const newSet = new Set(prev)
			if (newSet.has(index)) {
				newSet.delete(index)
			} else {
				newSet.add(index)
			}
			return newSet
		})
	}

	return (
		<div className="flex items-center justify-center my-5 mt-25">
			<div className="bg-gray-100/70 max-w-[980px] rounded-xl p-5 text-sm text-gray-600 w-full">
				<h1 className="text-black font-semibold text-3xl mb-5">Часто задаваемые вопросы (FAQ)</h1>
				<p className="mb-2">
					Платформа arivoo.ru — это российский маркетплейс и сервис сопровождения покупок с китайских площадок Taobao, 1688, Dewu (Poizon). Ниже вы
					найдёте ответы на самые частые и важные вопросы клиентов из России и стран СНГ.
				</p>

				{faqData.map((item, index) => (
					<div
						key={index}
						className="bg-gray-200/50 rounded-lg p-2.5 mb-4"
					>
						<div className="flex items-center justify-between">
							<span className="font-bold text-black text-base">{item.question}</span>
							<button
								onClick={() => toggle(index)}
								className="cursor-pointer p-1 w-8 h-8 rounded-2xl bg-gray-200 flex items-center justify-center"
							>
								{openIndexes.has(index) ? <Minus /> : <Plus />}
							</button>
						</div>
						<div
							className="overflow-hidden transition-all duration-300 ease-in-out"
							style={{
								maxHeight: openIndexes.has(index) ? '200px' : '0',
								opacity: openIndexes.has(index) ? 1 : 0,
								marginTop: openIndexes.has(index) ? '8px' : '0'
							}}
						>
							<p className="text-gray-700">{item.answer}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
