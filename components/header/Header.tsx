'use client'

import FullScreenLoader from '@/components/ui/FullScreenLoader/FullScreenLoader'
import { PagesConfig } from '@/config/pages.config'
import { useSearch } from '@/hooks'
import { useCartStore } from '@/lib/store'
import { useUserStore } from '@/lib/store/user'
import type { SearchSource } from '@/types/search'
import { LockKeyholeIcon, Search, ShoppingBagIcon, UserIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import HeaderLogo from '../logo/HeaderLogo'
import HeaderMenu from '../menu/HeaderMenu/HeaderMenu'
import SearchInput from '../ui/Input/SearchInput'

interface HeaderProps {
    openCart?: () => void
}

export default function Header({ openCart }: HeaderProps) {
    const totalCartItems = useCartStore(state => state.totalItems)
    const { user, isAuthenticated } = useUserStore()

    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [imageSearchLoading, setImageSearchLoading] = useState(false)
    const [imageSearchSource, setImageSearchSource] = useState<SearchSource>('1688')

    const { searchValue, handleChange, handleSearch } = useSearch()

    const handleCartClick = (e: React.MouseEvent) => {
        if (openCart) {
            e.preventDefault()
            openCart()
        }
    }

    const handleImageSearchClick = () => {
        fileInputRef.current?.click()
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageSearchLoading(true)

        try {
            const formData = new FormData()
            formData.append('image', file)
            formData.append('source', imageSearchSource)

            const response = await fetch('/api/search-image', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.success) {
                if (data.redirectUrl) {
                    router.push(data.redirectUrl)
                } else if (data.sessionId) {
                    router.push(`/image-search?sessionId=${data.sessionId}`)
                } else if (data.data?.length > 0) {
                    router.push(`/products?imageSearch=true&results=${encodeURIComponent(JSON.stringify(data.data))}`)
                } else {
                    alert(data.error || 'Ничего не найдено')
                }
            } else {
                alert(data.error || 'Ничего не найдено')
            }
        } catch (error) {
            console.error('Image search error:', error)
            alert('Ошибка поиска по изображению')
        } finally {
            setImageSearchLoading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    return (
        <>
            <header className="hidden px-20 py-10 lg:flex items-center justify-between bg-white sticky top-0 z-50 shadow-md">
                <HeaderLogo />
                <HeaderMenu />

                <div className="flex items-center gap-2">
                    <SearchInput
                        value={searchValue}
                        onChange={handleChange}
                        onSearch={handleSearch}
                        onImageSearch={handleImageSearchClick}
                        isImageSearchLoading={imageSearchLoading}
                        fileInputRef={fileInputRef}
                        onImageUpload={handleImageUpload}
                    />
                    <button
                        className="flex items-center justify-center rounded-lg bg-gradient-to-t from-[#0a4e32] from-0% to-[#0f6b46] to-100% p-1.5 text-white hover:bg-[#0a4e32]"
                        onClick={() => handleSearch(searchValue)}
                        aria-label="Поиск"
                    >
                        <Search className="w-7 h-7 text-white" />
                    </button>
                </div>

                {isAuthenticated ? (
                    <Link
                        href={PagesConfig.USER}
                        className="hover:text-orange-500 duration-300 relative flex items-center gap-2"
                        title="Профиль"
                        aria-label="Профиль"
                    >
                        <UserIcon aria-hidden="true" />
                        <span className="text-sm font-medium">{user?.name || 'Профиль'}</span>
                    </Link>
                ) : (
                    <Link
                        href={PagesConfig.LOGIN}
                        className="hover:text-orange-500 duration-300 relative"
                        title="Войти"
                        aria-label="Войти"
                    >
                        <LockKeyholeIcon aria-hidden="true" />
                    </Link>
                )}

                <div className="flex items-center gap-5">
                    {openCart ? (
                        <button
                            onClick={handleCartClick}
                            className="hover:text-orange-500 duration-300 relative cursor-pointer bg-transparent border-none p-0"
                            aria-label={`Корзина, ${totalCartItems} товаров`}
                        >
                            <div
                                className="bg-[#0f6b46] text-white rounded-[50%] text-[10px] font-medium flex items-center justify-center absolute top-[-5px] right-[-5px] min-w-[16px]"
                                id="counter-cart"
                                aria-hidden="true"
                            >
                                <span>{totalCartItems}</span>
                            </div>
                            <ShoppingBagIcon aria-hidden="true" />
                        </button>
                    ) : (
                        <Link
                            href={PagesConfig.CART}
                            className="hover:text-orange-500 duration-300 relative cursor-pointer"
                            aria-label={`Корзина, ${totalCartItems} товаров`}
                        >
                            <div
                                className="bg-[#0f6b46] text-white rounded-[50%] text-[10px] font-medium flex items-center justify-center absolute top-[-5px] right-[-5px] min-w-[16px]"
                                id="counter-cart"
                                aria-hidden="true"
                            >
                                <span>{totalCartItems}</span>
                            </div>
                            <ShoppingBagIcon aria-hidden="true" />
                        </Link>
                    )}
                </div>
            </header>

            <FullScreenLoader isLoading={imageSearchLoading} />
        </>
    )
}