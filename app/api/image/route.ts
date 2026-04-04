import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function isAllowedImageHost(url: URL) {
	const host = url.hostname.toLowerCase()
	return (
		host.endsWith('alicdn.com') ||
		host.endsWith('taobaocdn.com') ||
		host.endsWith('poizon.com') ||
		host.endsWith('dewucdn.com')
	)
}

export async function GET(request: NextRequest) {
	const rawUrl = request.nextUrl.searchParams.get('url')

	if (!rawUrl) {
		return new NextResponse('Missing url', { status: 400 })
	}

	let targetUrl: URL

	try {
		targetUrl = new URL(rawUrl)
	} catch {
		return new NextResponse('Invalid url', { status: 400 })
	}

	if (!['http:', 'https:'].includes(targetUrl.protocol)) {
		return new NextResponse('Invalid protocol', { status: 400 })
	}

	if (!isAllowedImageHost(targetUrl)) {
		return new NextResponse('Host not allowed', { status: 403 })
	}

	try {
		const upstream = await fetch(targetUrl.toString(), {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
				Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
				Referer: 'https://www.1688.com/',
				Origin: 'https://www.1688.com/'
			},
			cache: 'no-store'
		})

		if (!upstream.ok) {
			return new NextResponse(`Upstream error: ${upstream.status}`, {
				status: upstream.status
			})
		}

		const contentType = upstream.headers.get('content-type') || 'image/jpeg'
		const arrayBuffer = await upstream.arrayBuffer()

		return new NextResponse(arrayBuffer, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=86400, s-maxage=86400'
			}
		})
	} catch (error) {
		console.error('[api/image] proxy error:', error)
		return new NextResponse('Proxy fetch failed', { status: 500 })
	}
}