interface FormInputProps {
	label?: string
	type?: 'text' | 'email' | 'password' | 'number' | 'tel'
	placeholder?: string
	required?: boolean
	disabled?: boolean
	className?: string
	id?: string
	name?: string
	value?: string
	defaultValue?: string
	error?: string
	helperText?: string
	onChange?: (value: string) => void
	onBlur?: () => void
}

export default function FormInput({
	label,
	type = 'text',
	placeholder,
	required = false,
	disabled = false,
	className = '',
	id,
	name,
	value,
	defaultValue,
	error,
	helperText,
	onChange,
	onBlur
}: FormInputProps) {
	const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
		type,
		id: id || name,
		name,
		placeholder,
		required,
		disabled,
		onChange: e => onChange?.(e.target.value),
		onBlur,
		className: `w-full p-2.5 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b ${
			error ? 'border-red-500 focus-within:border-red-500' : 'focus-within:border-blue-400'
		}`
	}

	if (value !== undefined) {
		inputProps.value = value
	} else {
		inputProps.defaultValue = defaultValue
	}

	return (
		<div className={className}>
			<label
				htmlFor={id || name}
				className="block"
			>
				{label && (
					<span className="font-medium">
						{label}
						{required && ' *'}
					</span>
				)}
				<input {...inputProps} />
			</label>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
			{helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
		</div>
	)
}
