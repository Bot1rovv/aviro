import { create } from 'zustand'

interface TermsModalState {
	isOpen: boolean
	open: () => void
	close: () => void
}

export const useTermsModalStore = create<TermsModalState>(set => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false })
}))
