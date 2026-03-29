import { getFreight1688, getLogisticPriceTaobao } from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { NextRequest, NextResponse } from 'next/server'

function calculateFreight(firstFee: number, firstUnit: number, nextFee: number, nextUnit: number, totalWeight: number): number {
	if (totalWeight <= firstUnit) {
		return firstFee
	}

	const extraWeight = totalWeight - firstUnit
	const extraUnits = Math.ceil(extraWeight / nextUnit)
	return firstFee + extraUnits * nextFee
}

function calculateMoscowShipping(weightGrams: number): number {
	if (!weightGrams || weightGrams <= 0) return 0

	if (weightGrams <= 1000) {
		return 450 * (weightGrams / 1000)
	}

	if (weightGrams <= 2000) {
		return 370 * (weightGrams / 1000)
	}

	return 330 * (weightGrams / 1000)
}

const DEFAULT_FALLBACK_WEIGHT_GRAMS = 500

const WAREHOUSE_ADDRESS = {
	country: '中国',
	state: '上海市',
	city: '上海市',
	district: '浦东新区',
	address: '沪南路2218号西楼1502室',
	zip: '201204'
}

interface ApiResponse {
	code: number
	data?: Record<string, unknown>
	message?: string
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { items } = body

		if (!items || !Array.isArray(items)) {
			return NextResponse.json({ success: false, error: 'Missing items array' }, { status: 400 })
		}

		const shippingResults: Array<{
			productId: string
			source: string
			quantity: number
			shippingCost: number
			moscowShippingCost: number
			weightGrams: number
			error: string | null
			freight?: number
			postFee?: number
			apiResult?: unknown
		}> = []

		let totalShipping = 0
		let totalMoscowShipping = 0

		for (const item of items) {
			const { productId, quantity = 1, source, weightGrams: incomingWeightGrams } = item
			if (!productId || !source) continue

			let shippingCost = 0
			let moscowShippingCost = 0
			let error: string | null = null
			let freight = 0
			let postFee = 0
			let result: ApiResponse | undefined = undefined
			let resolvedWeightGrams = Number(incomingWeightGrams || 0)

			try {
				if (source === '1688') {
					const offerId = productId.replace('1688_', '')
					const toProvinceCode = '310000'
					const toCityCode = '310100'
					const toCountryCode = '310115'
					const totalNum = quantity
					const logisticsSkuNumModels: Array<{ skuId?: string; number?: number }> = [{ skuId: '4829152353068', number: quantity }]

					result = (await getFreight1688(
						offerId,
						toCityCode,
						toCountryCode,
						toProvinceCode,
						totalNum,
						logisticsSkuNumModels
					)) as ApiResponse

					if (result && result.code === 200 && result.data) {
						const data = result.data
						const firstFee = parseFloat(String(data.firstFee)) || 0
						const firstUnit = parseFloat(String(data.firstUnit)) || 0.5
						const nextFee = parseFloat(String(data.nextFee)) || 0
						const nextUnit = parseFloat(String(data.nextUnit)) || 0.5

						let unitWeightKg = 0

						if (
							data.productFreightSkuInfoModels &&
							Array.isArray(data.productFreightSkuInfoModels) &&
							data.productFreightSkuInfoModels.length > 0
						) {
							const sku = data.productFreightSkuInfoModels[0] as Record<string, unknown>
							unitWeightKg = Number(sku.singleSkuWeight || 0)
						}

						if (!unitWeightKg && data.singleProductWeight !== null && data.singleProductWeight !== undefined) {
							unitWeightKg = parseFloat(String(data.singleProductWeight)) || 0
						}

						if (!unitWeightKg || unitWeightKg <= 0) {
							unitWeightKg = DEFAULT_FALLBACK_WEIGHT_GRAMS / 1000
						}

						const totalWeightKg = unitWeightKg * quantity
						resolvedWeightGrams = Math.round(totalWeightKg * 1000)

						freight = calculateFreight(firstFee, firstUnit, nextFee, nextUnit, totalWeightKg)
						shippingCost = cnyToRub(freight)
						moscowShippingCost = calculateMoscowShipping(resolvedWeightGrams)
					} else {
						error = 'Failed to fetch freight'
					}
				} else if (source === 'taobao') {
					const itemId = productId.replace('taobao_', '')

					const addressInfo = {
						country: WAREHOUSE_ADDRESS.country,
						state: WAREHOUSE_ADDRESS.state,
						city: WAREHOUSE_ADDRESS.city,
						district: WAREHOUSE_ADDRESS.district
					}

					result = (await getLogisticPriceTaobao(itemId, addressInfo)) as ApiResponse

					if (result && result.code === 200 && result.data) {
						postFee = parseFloat(String(result.data.postFee)) / 100 || 0
						shippingCost = cnyToRub(postFee) * quantity

						if (!resolvedWeightGrams || resolvedWeightGrams <= 0) {
							resolvedWeightGrams = DEFAULT_FALLBACK_WEIGHT_GRAMS * quantity
						}

						moscowShippingCost = calculateMoscowShipping(resolvedWeightGrams)
					} else {
						error = 'Failed to fetch logistic price'
					}
				} else {
					if (!resolvedWeightGrams || resolvedWeightGrams <= 0) {
						resolvedWeightGrams = 0
					}
					moscowShippingCost = calculateMoscowShipping(resolvedWeightGrams)
				}
			} catch (err) {
				console.error(`Error calculating shipping for ${productId}:`, err)
				error = err instanceof Error ? err.message : 'Unknown error'
			}

			shippingResults.push({
				productId,
				source,
				quantity,
				shippingCost,
				moscowShippingCost,
				weightGrams: resolvedWeightGrams,
				error,
				freight: source === '1688' ? freight : undefined,
				postFee: source === 'taobao' ? postFee : undefined,
				apiResult: result
			})

			if (!error) {
				totalShipping += shippingCost
				totalMoscowShipping += moscowShippingCost
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				items: shippingResults,
				totalShipping,
				totalMoscowShipping,
				currency: 'RUB',
				warehouseAddress: WAREHOUSE_ADDRESS
			}
		})
	} catch (error) {
		console.error('[/api/shipping] Error:', error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}