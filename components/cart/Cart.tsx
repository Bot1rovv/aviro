import { Button } from '@/components/ui'
import { MESSAGES } from '@/config/constants'
import { useCartStore } from '@/lib/store'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Modal = dynamic(() => import('../ui/Modal/Modal'), {
    ssr: false,
    loading: () => <div className="hidden" />
})

interface CartProps {
    isOpen: boolean
    onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
    const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore()
    const router = useRouter()

    const handleCheckout = () => {
        onClose()
        router.push('/cart')
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            position="right"
            width="w-[400px]"
            height="h-screen"
            maxHeight="max-h-screen"
            className="p-0"
        >
            <div className="relative h-full">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <X
                        size={24}
                        className="cursor-pointer"
                    />
                </button>

                <div className="cart-body w-full h-full flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag />
                            {MESSAGES.CART_TITLE}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalItems}{' '}
                            {totalItems === 1
                                ? MESSAGES.CART_ITEM
                                : totalItems > 1 && totalItems < 5
                                  ? MESSAGES.CART_ITEMS
                                  : MESSAGES.CART_ITEMS_PLURAL}
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingBag
                                    size={48}
                                    className="mb-4"
                                />
                                <p>Корзина пуста</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div
                                        key={`${item.productId}-${item.color || ''}-${item.size || ''}-${item.skuId || ''}`}
                                        className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                                    >
                                        <Link
                                            href={`/product/${item.productId}`}
                                            onClick={onClose}
                                            className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 block"
                                        >
                                            {item.imageUrl ? (
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                    sizes="80px"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                    <ShoppingBag
                                                        size={24}
                                                        className="mb-1"
                                                    />
                                                    <p className="text-[10px] text-center">{MESSAGES.CART_EMPTY}</p>
                                                </div>
                                            )}
                                        </Link>

                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/product/${item.productId}`}
                                                onClick={onClose}
                                                className="block"
                                            >
                                                <h3
                                                    className="text-sm font-medium text-gray-900 mb-1 truncate hover:text-[#0f6b46] transition-colors"
                                                    title={item.title}
                                                >
                                                    {item.title}
                                                </h3>
                                            </Link>

                                            <p className="text-sm font-bold text-[#0f6b46] mb-2">{item.price} ₽</p>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center border border-gray-200 rounded-lg">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.quantity - 1,
                                                                item.color,
                                                                item.size,
                                                                item.skuId
                                                            )
                                                        }
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.productId,
                                                                item.quantity + 1,
                                                                item.color,
                                                                item.size,
                                                                item.skuId
                                                            )
                                                        }
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() =>
                                                        removeItem(item.productId, item.color, item.size, item.skuId)
                                                    }
                                                    className="p-2 text-[#0f6b46] hover:bg-green-50 rounded-lg transition-colors hover:cursor-pointer"
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {items.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-600">Итого:</span>
                                <span className="text-2xl font-bold text-gray-900">{totalPrice.toFixed(2)} ₽</span>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={handleCheckout}
                                >
                                    {MESSAGES.CHECKOUT}
                                </Button>
                                <Button
                                    variant="outline"
                                    fullWidth
                                    onClick={clearCart}
                                >
                                    {MESSAGES.CLEAR_CART}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}