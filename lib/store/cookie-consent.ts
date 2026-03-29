import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CookieConsentStore {
	consented: boolean
	dismissed: boolean
	setConsented: (value: boolean) => void
	setDismissed: (value: boolean) => void
	reset: () => void
}

export const useCookieConsentStore = create<CookieConsentStore>()(
	persist(
		set => ({
			consented: false,
			dismissed: false,
			setConsented: value => set({ consented: value, dismissed: true }),
			setDismissed: value => set({ dismissed: value }),
			reset: () => set({ consented: false, dismissed: false })
		}),
		{
			name: 'cookie-consent-storage'
		}
	)
)
