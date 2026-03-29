import { UserState } from '@/types/user'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUserStore = create<UserState>()(
	persist(
		set => ({
			user: null,
			isAuthenticated: false,

			setUser: user =>
				set({
					user,
					isAuthenticated: true
				}),

			logout: () =>
				set({
					user: null,
					isAuthenticated: false
				})
		}),
		{
			name: 'user-storage'
		}
	)
)

export type { User, UserState } from '@/types/user'
