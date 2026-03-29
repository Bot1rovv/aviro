export interface User {
	id: string
	email: string
	name: string
	phone?: string
}

export interface UserState {
	user: User | null
	isAuthenticated: boolean
	setUser: (user: User) => void
	logout: () => void
}
