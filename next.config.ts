import withBundleAnalyzer from '@next/bundle-analyzer'
import type { NextConfig } from 'next'

const bundleAnalyzer = withBundleAnalyzer({
	enabled: process.env.ANALYZE === 'true'
})

const nextConfig: NextConfig = {
	/* config options here */
	allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.1.67', 'localhost'],
	// CDN для статических ресурсов
	assetPrefix: process.env.CDN_URL || '',
	images: {
		remotePatterns: [
			// 1688
			{
				protocol: 'https',
				hostname: 'img.alicdn.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'gview.alicdn.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'img.china.alibaba.com',
				pathname: '/**'
			},
			{
				protocol: 'http',
				hostname: 'img.china.alibaba.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'cbu01.alicdn.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'global-img-cdn.1688.com',
				pathname: '/**'
			},
			// Taobao
			{
				protocol: 'https',
				hostname: 'gtms01.alicdn.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'assets.alicdn.com',
				pathname: '/**'
			},

			{
				protocol: 'https',
				hostname: 'gw.alicdn.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'img.taobao.com',
				pathname: '/**'
			},
			// Poizon
			{
				protocol: 'https',
				hostname: 'img.xqh.me',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'cdn.xqhh5.com',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'cdn.poizon.com',
				pathname: '/**'
			},
			// Placeholder
			{
				protocol: 'https',
				hostname: 'via.placeholder.com',
				pathname: '/**'
			}
		]
	}
}

export default bundleAnalyzer(nextConfig)
