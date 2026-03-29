'use client'

import { X } from 'lucide-react'
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	children: ReactNode
	width?: string
	height?: string
	maxHeight?: string
	title?: string
	position?: 'center' | 'right' | 'left' | 'top' | 'bottom'
	className?: string
}

/**
 * Универсальный компонент модального окна с плавной анимацией.
 */
export default function Modal({
	isOpen,
	onClose,
	children,
	width = 'max-w-md',
	height = 'auto',
	maxHeight = 'max-h-[90vh]',
	title,
	position = 'center',
	className = ''
}: ModalProps) {
	const [isAnimating, setIsAnimating] = useState(false)
	const [isShown, setIsShown] = useState(false)
	const modalRef = useRef<HTMLDivElement>(null)
	const previousActiveElement = useRef<HTMLElement | null>(null)

	// Запоминаем активный элемент при открытии
	useLayoutEffect(() => {
		if (isOpen) {
			previousActiveElement.current = document.activeElement as HTMLElement
			requestAnimationFrame(() => {
				setIsShown(true)
				setIsAnimating(true)
			})
		} else {
			requestAnimationFrame(() => {
				setIsAnimating(false)
			})
			const timer = setTimeout(() => setIsShown(false), 350)
			return () => clearTimeout(timer)
		}
	}, [isOpen])

	// Управление фокусом и ловушка фокуса
	useEffect(() => {
		if (!isShown) return

		const modalElement = modalRef.current
		if (!modalElement) return

		// Фокусируем первый фокусируемый элемент внутри модалки
		const focusableElements = modalElement.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
		const firstFocusable = focusableElements[0] as HTMLElement | null
		if (firstFocusable) {
			firstFocusable.focus()
		} else {
			modalElement.focus()
		}

		// Ловушка фокуса
		const handleTabKey = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return

			if (!focusableElements.length) {
				e.preventDefault()
				return
			}

			const first = focusableElements[0]
			const last = focusableElements[focusableElements.length - 1]

			if (e.shiftKey) {
				// Shift + Tab
				if (document.activeElement === first) {
					last.focus()
					e.preventDefault()
				}
			} else {
				// Tab
				if (document.activeElement === last) {
					first.focus()
					e.preventDefault()
				}
			}
		}

		const handleEscapeKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose()
			}
		}

		document.addEventListener('keydown', handleTabKey)
		document.addEventListener('keydown', handleEscapeKey)

		return () => {
			document.removeEventListener('keydown', handleTabKey)
			document.removeEventListener('keydown', handleEscapeKey)
			// Возвращаем фокус на предыдущий активный элемент
			if (previousActiveElement.current) {
				previousActiveElement.current.focus()
			}
		}
	}, [isShown, onClose])

	if (!isShown) return null

	const positionClasses = {
		center: 'items-center justify-center',
		right: 'items-center justify-end',
		left: 'items-center justify-start',
		top: 'items-start justify-center',
		bottom: 'items-end justify-center'
	}

	const panelClasses = {
		center: 'rounded-lg',
		right: 'h-full rounded-lg',
		left: 'h-full rounded-lg',
		top: 'w-full rounded-b-lg',
		bottom: 'w-full rounded-t-lg'
	}

	// Анимация в зависимости от позиции
	const getTransformClass = () => {
		const base = 'transition-all duration-300 ease-out '
		if (position === 'center') {
			return base + (isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0')
		}
		if (position === 'right') {
			return base + (isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0')
		}
		if (position === 'left') {
			return base + (isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0')
		}
		if (position === 'top') {
			return base + (isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0')
		}
		if (position === 'bottom') {
			return base + (isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0')
		}
		return base
	}

	return (
		<div className={`fixed inset-0 z-[60] flex ${positionClasses[position]}`}>
			{/* Overlay */}
			<div
				className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
				onClick={onClose}
				role="presentation"
				aria-hidden="true"
			/>

			{/* Modal container */}
			<div
				ref={modalRef}
				className={`relative z-[60] bg-white shadow-xl ${width} ${height} ${maxHeight} overflow-y-auto ${getTransformClass()} ${panelClasses[position]} ${className}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? 'modal-title' : undefined}
				tabIndex={-1}
			>
				{/* Header */}
				{title && (
					<div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
						<h3
							className="text-xl font-semibold text-black"
							id="modal-title"
						>
							{title}
						</h3>
						<button
							onClick={onClose}
							className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
							aria-label="Закрыть"
						>
							<X
								size={24}
								className="cursor-pointer"
								aria-hidden="true"
							/>
						</button>
					</div>
				)}
				{/* Content */}
				<div className="p-4">{children}</div>
			</div>
		</div>
	)
}
