import { authOptions } from '@/lib/auth'
import { addToHistory, clearUserHistory, getUserHistory } from '@/lib/server/user-service'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const history = await getUserHistory(session.user.id)

	return NextResponse.json({ success: true, data: history })
}

export async function DELETE() {
	const session = await getServerSession(authOptions)

	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		await clearUserHistory(session.user.id)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Clear history error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: Request) {
	const session = await getServerSession(authOptions)

	if (!session?.user?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await request.json()
		const { action, productId, productTitle, productPrice, productImage, details } = body

		if (!action) {
			return NextResponse.json({ error: 'Action is required' }, { status: 400 })
		}

		const product = productId
			? {
					productId,
					title: productTitle || '',
					price: productPrice || '',
					imageUrl: productImage || ''
				}
			: undefined

		const id = await addToHistory(session.user.id, action, product, details)

		return NextResponse.json({ success: true, id })
	} catch (error) {
		console.error('History error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
