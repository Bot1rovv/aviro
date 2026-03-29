'use client'

import { Camera, Loader2, Search } from 'lucide-react'
import { forwardRef, KeyboardEvent, RefObject, useCallback, useEffect, useState } from 'react'

export interface SearchInputProps {
	value?: string
	onChange?: (value: string) => void
	onSearch?: (value: string) => void
	placeholder?: string
	className?: string
	inputClassName?: string
	disabled?: boolean
	maxWidth?: string
	// Для поиска по изображению
	onImageSearch?: () => void
	isImageSearchLoading?: boolean
	fileInputRef?: RefObject<HTMLInputElement | null>
	onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
	(
		{
			value = '',
			onChange,
			onSearch,
			placeholder = 'Поиск товаров...',
			className = '',
			inputClassName = '',
			disabled = false,
			maxWidth = '580px',
			onImageSearch,
			isImageSearchLoading = false,
			fileInputRef,
			onImageUpload
		},
		ref
	) => {
		const [internalValue, setInternalValue] = useState(value)

		// Синхронизируем internalValue с value, если value изменилось извне
		useEffect(() => {
			setInternalValue(value)
		}, [value])

		const isControlled = onChange !== undefined

		const handleChange = useCallback(
			(e: React.ChangeEvent<HTMLInputElement>) => {
				const newValue = e.target.value
				if (!isControlled) {
					setInternalValue(newValue)
				}
				onChange?.(newValue)
			},
			[onChange, isControlled]
		)

		const currentValue = isControlled ? value : internalValue

		const handleKeyDown = useCallback(
			(e: KeyboardEvent<HTMLInputElement>) => {
				if (e.key === 'Enter' && onSearch) {
					onSearch(currentValue)
				}
			},
			[onSearch, currentValue]
		)

		const handleIconClick = useCallback(() => {
			if (onSearch) {
				onSearch(currentValue)
			}
		}, [onSearch, currentValue])

		const hasSearchButton = onSearch
		const hasImageSearch = onImageSearch && fileInputRef && onImageUpload

		return (
			<div
				className={`relative w-full ${className}`}
				style={{ maxWidth }}
				role="search"
				aria-label="Поле поиска"
			>
				<label
					htmlFor="search-input"
					className="sr-only"
				>
					{placeholder}
				</label>
				{/* Скрытый input для загрузки изображения */}
				{hasImageSearch && (
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/jpg,image/png,image/webp"
						onChange={onImageUpload}
						className="hidden"
					/>
				)}
				<input
					ref={ref}
					id="search-input"
					className={`w-full rounded-2xl pl-5 pr-12 py-3 bg-gray-300 placeholder:text-gray-500
		          focus-visible:text-gray-800 focus-visible:bg-gray-100 focus-visible:outline-none
		          focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors duration-200
		          disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
					type="search"
					name="search"
					value={currentValue}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					disabled={disabled}
					aria-label={placeholder}
					enterKeyHint="search"
				/>
				{/* Левая часть - кнопка камеры (если есть) или иконка поиска */}
				<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
					{hasImageSearch ? (
						<button
							type="button"
							className={`flex items-center justify-center rounded-lg bg-gray-200 p-1.5 hover:bg-gray-300 transition ${isImageSearchLoading ? 'opacity-50 cursor-wait' : ''} pointer-events-auto`}
							onClick={onImageSearch}
							disabled={isImageSearchLoading || disabled}
							aria-label={isImageSearchLoading ? 'Поиск...' : 'Поиск по изображению'}
							title="Поиск по изображению"
						>
							{isImageSearchLoading ? (
								<Loader2
									size={23}
									className="animate-spin"
								/>
							) : (
								<Camera size={23} />
							)}
						</button>
					) : (
						<Search className="w-5 h-5 text-gray-500" />
					)}
				</div>
			</div>
		)
	}
)

SearchInput.displayName = 'SearchInput'

export default SearchInput
