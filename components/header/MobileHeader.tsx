'use client'

import { MobileMenuModal, MobileSearchInput } from '@/components/ui'
import FullScreenLoader from '@/components/ui/FullScreenLoader/FullScreenLoader'
import { PagesConfig } from '@/config/pages.config'
import { useSearch } from '@/hooks'
import { useCartStore, useFavoritesStore } from '@/lib/store'
import type { SearchSource } from '@/types/search'
import { Heart, Menu, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Suspense, useRef, useState } from 'react'

export default function MobileHeader() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [imageSearchLoading, setImageSearchLoading] = useState(false)
    const [imageSearchSource, setImageSearchSource] = useState<SearchSource>('1688')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const totalCartItems = useCartStore(state => state.totalItems)
    const totalFavorites = useFavoritesStore(state => state.totalItems)

    const { searchValue, handleChange, handleSearch } = useSearch()

    const handleImageSearch = () => {
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

    const openMenu = () => setMenuOpen(true)
    const closeMenu = () => setMenuOpen(false)

    return (
        <>
            <header className="fixed w-screen h-auto py-5 bg-white z-10 lg:hidden">
                <div className="container mx-2.5">
                    <div className="flex items-center justify-between gap-4">
                        <button
                            id="burger"
                            onClick={openMenu}
                            aria-label="Открыть меню"
                        >
                            <Menu />
                        </button>

                        <Link
                            href={PagesConfig.HOME}
                            className="flex-shrink-0"
                        >
                            <Image
                                src="/images/logo-header.png"
                                alt="Logo"
                                width={100}
                                height={100}
                            />
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/favorites"
                                className="relative"
                                aria-label={`Избранное, ${totalFavorites} товаров`}
                            >
                                <Heart />
                                {totalFavorites > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-[#0f6b46] text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
                                        {totalFavorites > 9 ? '9+' : totalFavorites}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href={PagesConfig.CART}
                                className="relative"
                                aria-label={`Корзина, ${totalCartItems} товаров`}
                            >
                                <ShoppingBag />
                                {totalCartItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-[#0f6b46] text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
                                        {totalCartItems > 9 ? '9+' : totalCartItems}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>

                    <MobileSearchInput
                        value={searchValue}
                        onChange={handleChange}
                        onSearch={handleSearch}
                        onImageSearch={handleImageSearch}
                        placeholder="Поиск товаров"
                        imageSearchLoading={imageSearchLoading}
                    />

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>
            </header>

            <Suspense fallback={null}>
                <MobileMenuModal
                    isOpen={menuOpen}
                    onClose={closeMenu}
                />
            </Suspense>

            <FullScreenLoader isLoading={imageSearchLoading} />
        </>
    )
}