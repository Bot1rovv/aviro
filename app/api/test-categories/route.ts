import { dajiFetch } from '@/lib/api-client'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url)
	const categoryID = searchParams.get('categoryID') || '0'

	try {
		const endpoint = '/alibaba/category/get'
		const params: Record<string, string | number | boolean> = {
			categoryID: categoryID
		}

		const response = await dajiFetch(endpoint, {
			method: 'GET',
			params
		})

		return NextResponse.json({
			success: true,
			data: response,
			debug: {
				params,
				endpoint
			},
			timestamp: new Date().toISOString()
		})
	} catch (error: unknown) {
		console.error('Categories API error:', error)
		const errorMessage = error instanceof Error ? error.message : 'Unknown error'
		const errorDetails = error instanceof Error ? error.toString() : String(error)
		return NextResponse.json(
			{
				success: false,
				error: errorMessage,
				details: errorDetails
			},
			{ status: 500 }
		)
	}
}
