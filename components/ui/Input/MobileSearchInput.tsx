'use client'

import { Camera, Loader2, Search } from 'lucide-react'
import { forwardRef, KeyboardEvent, useCallback, useEffect, useState } from 'react'

export interface MobileSearchInputProps {
    value?: string
    onChange?: (value: string) => void
    onSearch?: (value: string) => void
    onImageSearch?: () => void
    placeholder?: string
    className?: string
    disabled?: boolean
    imageSearchLoading?: boolean
}

const MobileSearchInput = forwardRef<HTMLInputElement, MobileSearchInputProps>(
    (
        { value = '', onChange, onSearch, onImageSearch, placeholder = 'Поиск товаров', className = '', disabled = false, imageSearchLoading = false },
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

        const handleImageSearchClick = useCallback(() => {
            if (onImageSearch) {
                onImageSearch()
            }
        }, [onImageSearch])

        const handleFormSubmit = useCallback(
            (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                if (onSearch) {
                    onSearch(currentValue)
                }
            },
            [onSearch, currentValue]
        )

        return (
            <form
                /* ИЗМЕНЕНО: focus-within:border-blue-200 -> focus-within:border-green-200 */
                className={`relative mb-2 mt-3 rounded-xl w-full focus-within:border focus-within:border-green-200 shadow-lg ${className}`}
                id="search"
                onSubmit={handleFormSubmit}
            >
                <input
                    ref={ref}
                    type="text"
                    placeholder={placeholder}
                    className="text-gray-500 p-2.5 w-full max-w-[80%] min-h-[38px] outline-none bg-transparent "
                    value={currentValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                />
                <div className="absolute flex items-center gap-2 top-[50%] translate-y-[-50%] right-2.5">
                    {onImageSearch && (
                        <button
                            type="button"
                            className={`flex items-center justify-center rounded-lg bg-gray-200 p-1.5 ${imageSearchLoading ? 'opacity-50 cursor-wait' : ''}`}
                            id="image-search"
                            onClick={handleImageSearchClick}
                            disabled={imageSearchLoading}
                            aria-label={imageSearchLoading ? 'Поиск...' : 'Поиск по изображению'}
                        >
                            {imageSearchLoading ? (
                                <Loader2
                                    size={23}
                                    className="animate-spin"
                                />
                            ) : (
                                <Camera size={23} />
                            )}
                        </button>
                    )}
                    <button
                        type="submit"
                        /* ИЗМЕНЕНО: bg-blue-900 bg-gradient-to-t from-[#0d65df] to-[#0752c2] -> bg-[#0f6b46] bg-gradient-to-t from-[#0a4e32] to-[#0f6b46] */
                        className="flex items-center justify-center rounded-lg bg-[#0f6b46] p-1.5 bg-gradient-to-t from-[#0a4e32] from-0% to-[#0f6b46] to-100%"
                        aria-label="Выполнить поиск"
                    >
                        <Search
                            fill="transparent"
                            className="text-white"
                            size={23}
                        />
                    </button>
                </div>
            </form>
        )
    }
)

MobileSearchInput.displayName = 'MobileSearchInput'

export default MobileSearchInput