import { db } from '@/lib/db'
import { user, userHistory, session, account, verification, order } from '@/lib/db/schema'
import { NextResponse } from 'next/server'

// Удаление всех пользователей и связанных данных
export async function DELETE() {
	try {
		// Удаляем в порядке зависимостей (сначала связанные таблицы)
		await db.delete(session)
		await db.delete(account)
		await db.delete(userHistory)
		await db.delete(order)
		await db.delete(verification)
		await db.delete(user)

		return NextResponse.json({
			success: true,
			message: 'Все пользователи и связанные данные удалены'
		})
	} catch (error) {
		console.error('[CleanUsers] Error:', error)
		return NextResponse.json({ success: false, error: 'Ошибка при очистке базы данных' }, { status: 500 })
	}
}
