import { cn } from '@/lib/utils/utils'
import { Loader2 } from 'lucide-react'
import { forwardRef, ReactNode } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

	size?: 'sm' | 'md' | 'lg'

	icon?: ReactNode

	iconPosition?: 'left' | 'right'

	fullWidth?: boolean

	loading?: boolean

	className?: string

	children?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ variant = 'primary', size = 'md', icon, iconPosition = 'left', fullWidth = false, loading = false, className, children, disabled, ...props },
		ref
	) => {
		const baseClasses =
			'inline-flex items-center justify-center font-bold capitalize rounded-3xl cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 font-bold'

		const variantClasses = {
			primary: 'bg-blue-700 text-white hover:bg-blue-900 hover:shadow-blue-300 bg-gradient-to-t from-[#0d65df] from-0% to-[#0752c2] to-100% ',
			secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
			outline: 'border-2 border-blue-700 text-blue-700 bg-transparent hover:bg-blue-50',
			ghost: 'text-gray-700 hover:bg-gray-100',
			danger: 'bg-red-600 text-white hover:bg-red-700'
		}

		const sizeClasses = {
			sm: 'px-3 py-1.5 text-sm h-8',
			md: 'px-5 py-2 text-base h-12',
			lg: 'px-6 py-3 text-lg h-14'
		}

		const widthClass = fullWidth ? 'w-full' : ''
		const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''

		const combinedClasses = cn(baseClasses, variantClasses[variant], sizeClasses[size], widthClass, disabledClass, className)

		return (
			<button
				ref={ref}
				className={combinedClasses}
				disabled={disabled || loading}
				aria-busy={loading}
				{...props}
			>
				{loading && (
					<Loader2
						className="animate-spin mr-2 h-4 w-4"
						aria-hidden="true"
					/>
				)}
				{!loading && icon && iconPosition === 'left' && (
					<span
						className="mr-2"
						aria-hidden="true"
					>
						{icon}
					</span>
				)}
				{children}
				{!loading && icon && iconPosition === 'right' && (
					<span
						className="ml-2"
						aria-hidden="true"
					>
						{icon}
					</span>
				)}
			</button>
		)
	}
)

Button.displayName = 'Button'

export default Button
