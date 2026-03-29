export interface YandexPayWindow {
	YaPay?: {
		PaymentEnv: {
			Sandbox: string
			Production: string
		}
		ButtonType: {
			Pay: string
			Simple: string
		}
		ButtonTheme: {
			Black: string
			White: string
			WhiteOutlined: string
		}
		ButtonWidth: {
			Auto: string
			Full: string
		}
		WidgetType: {
			Ultimate: string
			Simple: string
		}
		WidgetTheme: {
			Light: string
			Dark: string
		}
		WidgetBackground: {
			Default: string
			Saturated: string
			Transparent: string
		}
		WidgetSize: {
			SMALL: string
			MEDIUM: string
			LARGE: string
		}
		createSession: (paymentData: YandexPayPaymentData, callbacks: YandexPayCallbacks) => Promise<YandexPaySession>
	}
}

export interface YandexPayPaymentData {
	env: string
	version: number
	currencyCode: string
	merchantId: string
	totalAmount: string
	availablePaymentMethods: readonly string[]
}

export interface YandexPayCallbacks {
	onPayButtonClick: () => Promise<string>
	onFormOpenError?: (reason: string) => void
	onFormOpen?: () => void
	onFormClose?: () => void
}

export interface YandexPaySession {
	mountButton: (container: HTMLElement, options: YandexPayButtonOptions) => void
	unmountButton: () => void
	mountWidget: (container: HTMLElement, options: YandexPayWidgetOptions) => void
	unmountWidget: () => void
	destroy: () => void
}

export interface YandexPayButtonOptions {
	type: string
	theme: string
	width: string
}

export interface YandexPayWidgetOptions {
	widgetType: string
	theme?: string
	hideWidgetHeader?: boolean
	background?: string
	withOutline?: boolean
	borderRadius?: string | number
	hasPadding?: boolean
	size?: string
	hasCheckoutButton?: boolean
	showCheckout?: boolean
}

export interface PaymentOrderData {
	items: Array<{
		id: string
		title: string
		price: string
		quantity: number
		image?: string
	}>
	userInfo: UserInfo
}

export interface UserInfo {
	email?: string
	phone?: string
	firstName?: string
	lastName?: string
	city?: string
	address?: string
}
