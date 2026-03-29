import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email'
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpSecure = process.env.SMTP_SECURE === 'true'
const smtpUser = process.env.SMTP_USER || ''
const smtpPass = process.env.SMTP_PASS || ''
const emailFrom = process.env.EMAIL_FROM || smtpUser || 'noreply@arivoo.com'
const emailFromName = process.env.EMAIL_FROM_NAME || 'Arivoo'

// Создаём транспортер (реиспользуемый)
const transporter = nodemailer.createTransport({
	host: smtpHost,
	port: smtpPort,
	secure: smtpSecure, // true для 465, false для других портов
	auth: {
		user: smtpUser,
		pass: smtpPass
	}
})

export interface EmailOptions {
	to: string
	subject: string
	html: string
	text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
	try {
		const info = await transporter.sendMail({
			from: `"${emailFromName}" <${emailFrom}>`,
			to,
			subject,
			text: text || html.replace(/<[^>]*>/g, ''),
			html
		})

		console.log('Email sent:', info.messageId)
		// Если используется Ethereal, выводим ссылку на просмотр
		if (smtpHost.includes('ethereal.email')) {
			console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
		}
		return { success: true, messageId: info.messageId }
	} catch (error) {
		console.error('Error sending email:', error)
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
	}
}

// Функция для отправки email подтверждения
export async function sendVerificationEmail(email: string, token: string) {
	const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
	const subject = 'Подтвердите ваш email на Arivoo'
	const logoUrl = `${process.env.NEXTAUTH_URL}/images/logo-header.png`
	const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Подтверждение email</title>
    <style>
        body {
            font-family: 'Montserrat', Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #0f2332;
            padding: 30px 20px;
            text-align: center;
        }
        .logo {
            max-width: 180px;
            height: auto;
        }
        .content {
            padding: 40px 30px;
        }
        h1 {
            color: #0f2332;
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 20px;
            font-weight: 700;
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #666;
        }
        .button {
            display: inline-block;
            background: linear-gradient(to top, #0d65df 0%, #0752c2 100%);
            color: #fff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            text-transform: capitalize;
            margin: 25px 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(7, 82, 194, 0.3);
            border: none;
            cursor: pointer;
            line-height: 1.2;
            min-width: 200px;
            text-align: center;
            vertical-align: middle;
        }
        .button:hover {
            background: linear-gradient(to top, #0a5bc8 0%, #0648a8 100%);
            box-shadow: 0 6px 16px rgba(7, 82, 194, 0.4);
            transform: translateY(-2px);
        }
        .button:active {
            transform: translateY(0);
        }
        .verification-url {
            word-break: break-all;
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            font-size: 14px;
            color: #555;
            margin: 20px 0;
        }
        .footer {
            background-color: #f5f5f5;
            padding: 25px 30px;
            text-align: center;
            font-size: 14px;
            color: #888;
            border-top: 1px solid #eaeaea;
        }
        .footer a {
            color: #0752c2;
            text-decoration: none;
        }
        .highlight {
            color: #0f2332;
            font-weight: 600;
        }
        @media (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoUrl}" alt="Arivoo" class="logo" />
        </div>
        <div class="content">
            <h1>🎉 Добро пожаловать на Arivoo!</h1>
            <p>Спасибо за регистрацию! Для завершения создания аккаунта необходимо подтвердить ваш email‑адрес.</p>
            <p>Рады видеть вас в нашем сообществе покупателей и продавцов товаров из Китая.</p>
            <p>Нажмите на кнопку ниже, чтобы активировать учётную запись:</p>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Подтвердить email</a>
            </p>
            <p>Если кнопка не работает, скопируйте и вставьте в браузер следующую ссылку:</p>
            <div class="verification-url">${verificationUrl}</div>
            <p>Ссылка действительна в течение <span class="highlight">24 часов</span>. Если вы не регистрировались на Arivoo, просто проигнорируйте это письмо.</p>
            <p>Если у вас возникли вопросы, обратитесь в нашу <a href="${process.env.NEXTAUTH_URL}/faq">службу поддержки</a>.</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Arivoo. Все права защищены.</p>
            <p><a href="${process.env.NEXTAUTH_URL}">Перейти на сайт</a> | <a href="${process.env.NEXTAUTH_URL}/privacy-policy">Политика конфиденциальности</a></p>
        </div>
    </div>
</body>
</html>
	`
	return sendEmail({ to: email, subject, html })
}

// Функция для отправки email восстановления пароля
export async function sendPasswordResetEmail(email: string, token: string) {
	const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
	const subject = 'Восстановление пароля на Arivoo'
	const logoUrl = `${process.env.NEXTAUTH_URL}/images/logo-header.png`
	const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
	   <meta charset="UTF-8">
	   <meta name="viewport" content="width=device-width, initial-scale=1.0">
	   <title>Восстановление пароля</title>
	   <style>
	       body {
	           font-family: 'Montserrat', Arial, Helvetica, sans-serif;
	           margin: 0;
	           padding: 0;
	           background-color: #f9f9f9;
	           color: #333;
	       }
	       .container {
	           max-width: 600px;
	           margin: 0 auto;
	           background-color: #ffffff;
	           border-radius: 16px;
	           overflow: hidden;
	           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	       }
	       .header {
	           background-color: #0f2332;
	           padding: 30px 20px;
	           text-align: center;
	       }
	       .logo {
	           max-width: 180px;
	           height: auto;
	       }
	       .content {
	           padding: 40px 30px;
	       }
	       h1 {
	           color: #0f2332;
	           font-size: 28px;
	           margin-top: 0;
	           margin-bottom: 20px;
	           font-weight: 700;
	       }
	       p {
	           font-size: 16px;
	           line-height: 1.6;
	           margin-bottom: 20px;
	           color: #666;
	       }
	       .button {
	           display: inline-block;
	           background: linear-gradient(to top, #0d65df 0%, #0752c2 100%);
	           color: #fff !important;
	           text-decoration: none;
	           padding: 14px 28px;
	           border-radius: 12px;
	           font-weight: 700;
	           font-size: 16px;
	           text-transform: capitalize;
	           margin: 25px 0;
	           transition: all 0.3s ease;
	           box-shadow: 0 4px 12px rgba(7, 82, 194, 0.3);
	           border: none;
	           cursor: pointer;
	           line-height: 1.2;
	           min-width: 200px;
	           text-align: center;
	           vertical-align: middle;
	       }
	       .button:hover {
	           background: linear-gradient(to top, #0a5bc8 0%, #0648a8 100%);
	           box-shadow: 0 6px 16px rgba(7, 82, 194, 0.4);
	           transform: translateY(-2px);
	       }
	       .button:active {
	           transform: translateY(0);
	       }
	       .verification-url {
	           word-break: break-all;
	           background-color: #f5f5f5;
	           padding: 15px;
	           border-radius: 6px;
	           font-size: 14px;
	           color: #555;
	           margin: 20px 0;
	       }
	       .footer {
	           background-color: #f5f5f5;
	           padding: 25px 30px;
	           text-align: center;
	           font-size: 14px;
	           color: #888;
	           border-top: 1px solid #eaeaea;
	       }
	       .footer a {
	           color: #0752c2;
	           text-decoration: none;
	       }
	       .highlight {
	           color: #0f2332;
	           font-weight: 600;
	       }
	       @media (max-width: 600px) {
	           .content {
	               padding: 30px 20px;
	           }
	           h1 {
	               font-size: 24px;
	           }
	       }
	   </style>
</head>
<body>
	   <div class="container">
	       <div class="header">
	           <img src="${logoUrl}" alt="Arivoo" class="logo" />
	       </div>
	       <div class="content">
	           <h1>🔑 Восстановление пароля</h1>
	           <p>Мы получили запрос на восстановление пароля для вашего аккаунта на Arivoo.</p>
	           <p>Для безопасности вашего аккаунта мы создали уникальную ссылку для сброса пароля. Нажмите на кнопку ниже, чтобы установить новый пароль:</p>
	           <p style="text-align: center;">
	               <a href="${resetUrl}" class="button">Восстановить пароль</a>
	           </p>
	           <p>Если кнопка не работает, скопируйте и вставьте в браузер следующую ссылку:</p>
	           <div class="verification-url">${resetUrl}</div>
	           <p>Ссылка действительна в течение <span class="highlight">1 часа</span>. Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>
	           <p>Если у вас возникли вопросы, обратитесь в нашу <a href="${process.env.NEXTAUTH_URL}/faq">службу поддержки</a>.</p>
	       </div>
	       <div class="footer">
	           <p>© ${new Date().getFullYear()} Arivoo. Все права защищены.</p>
	           <p><a href="${process.env.NEXTAUTH_URL}">Перейти на сайт</a> | <a href="${process.env.NEXTAUTH_URL}/privacy-policy">Политика конфиденциальности</a></p>
	       </div>
	   </div>
</body>
</html>
	`
	return sendEmail({ to: email, subject, html })
}

// Функция для отправки уведомления о статусе заказа
export async function sendOrderStatusEmail(
	email: string,
	order: {
		id: string
		status: string
		total?: string
		items?: Array<{
			title: string
			price: number
			quantity: number
			image?: string
		}>
		createdAt: string
		trackingNumber?: string
	}
) {
	const statusText: Record<string, string> = {
		pending: 'ожидает оплаты',
		paid: 'оплачен',
		processing: 'в обработке',
		shipped: 'отправлен',
		delivered: 'доставлен',
		cancelled: 'отменён',
		refunded: 'возвращён'
	}
	const statusDisplay = statusText[order.status] || order.status

	const subject = `Статус вашего заказа ${order.id} изменён`
	const logoUrl = `${process.env.NEXTAUTH_URL}/images/logo-header.png`
	const siteUrl = process.env.NEXTAUTH_URL || 'https://arivoo-hazel.vercel.app/'
	const formattedDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})

	let trackingHtml = ''
	if (order.trackingNumber) {
		trackingHtml = `
			<p><strong>Трек-номер для отслеживания:</strong> ${order.trackingNumber}</p>
			<p>Вы можете отслеживать посылку на сайте службы доставки.</p>
		`
	}

	const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
	   <meta charset="UTF-8">
	   <meta name="viewport" content="width=device-width, initial-scale=1.0">
	   <title>Статус заказа ${order.id}</title>
	   <style>
	       body {
	           font-family: 'Montserrat', Arial, Helvetica, sans-serif;
	           margin: 0;
	           padding: 0;
	           background-color: #f9f9f9;
	           color: #333;
	       }
	       .container {
	           max-width: 600px;
	           margin: 0 auto;
	           background-color: #ffffff;
	           border-radius: 16px;
	           overflow: hidden;
	           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	       }
	       .header {
	           background-color: #0f2332;
	           padding: 30px 20px;
	           text-align: center;
	       }
	       .logo {
	           max-width: 180px;
	           height: auto;
	       }
	       .content {
	           padding: 40px 30px;
	       }
	       h1 {
	           color: #0f2332;
	           font-size: 28px;
	           margin-top: 0;
	           margin-bottom: 20px;
	           font-weight: 700;
	       }
	       p {
	           font-size: 16px;
	           line-height: 1.6;
	           margin-bottom: 20px;
	           color: #666;
	       }
	       .status-badge {
	           display: inline-block;
	           background: linear-gradient(135deg, #0d65df 0%, #0752c2 100%);
	           color: #fff;
	           padding: 8px 20px;
	           border-radius: 24px;
	           font-weight: 700;
	           margin: 10px 0;
	           box-shadow: 0 4px 8px rgba(7, 82, 194, 0.2);
	           text-transform: uppercase;
	           font-size: 14px;
	           letter-spacing: 0.5px;
	       }
	       .button {
	           display: inline-block;
	           background: linear-gradient(to top, #0d65df 0%, #0752c2 100%);
	           color: #fff !important;
	           text-decoration: none;
	           padding: 14px 28px;
	           border-radius: 12px;
	           font-weight: 700;
	           font-size: 16px;
	           text-transform: capitalize;
	           margin: 25px 0;
	           transition: all 0.3s ease;
	           box-shadow: 0 4px 12px rgba(7, 82, 194, 0.3);
	           border: none;
	           cursor: pointer;
	           line-height: 1.2;
	           min-width: 200px;
	           text-align: center;
	           vertical-align: middle;
	       }
	       .button:hover {
	           background: linear-gradient(to top, #0a5bc8 0%, #0648a8 100%);
	           box-shadow: 0 6px 16px rgba(7, 82, 194, 0.4);
	           transform: translateY(-2px);
	       }
	       .footer {
	           background-color: #f5f5f5;
	           padding: 25px 30px;
	           text-align: center;
	           font-size: 14px;
	           color: #888;
	           border-top: 1px solid #eaeaea;
	       }
	       .footer a {
	           color: #0752c2;
	           text-decoration: none;
	       }
	       @media (max-width: 600px) {
	           .content {
	               padding: 30px 20px;
	           }
	           h1 {
	               font-size: 24px;
	           }
	       }
	   </style>
</head>
<body>
	   <div class="container">
	       <div class="header">
	           <img src="${logoUrl}" alt="Arivoo" class="logo" />
	       </div>
	       <div class="content">
	           <h1>Статус вашего заказа изменён</h1>
	           <p>Уважаемый покупатель, статус вашего заказа <strong>${order.id}</strong> был обновлён.</p>
	           <p><strong>Новый статус:</strong> <span class="status-badge">${statusDisplay}</span></p>
	           <p><strong>Дата заказа:</strong> ${formattedDate}</p>
	           ${order.total ? `<p><strong>Сумма заказа:</strong> ${parseFloat(order.total).toLocaleString('ru-RU')} ₽</p>` : ''}
	           ${trackingHtml}
	           <p style="text-align: center;">
	               <a href="${siteUrl}/user/orders" class="button">Перейти к моим заказам</a>
	           </p>
	           <p>Если у вас возникли вопросы, свяжитесь с нашей <a href="${siteUrl}/faq">службой поддержки</a>.</p>
	       </div>
	       <div class="footer">
	           <p>© ${new Date().getFullYear()} Arivoo. Все права защищены.</p>
	           <p><a href="${siteUrl}">Перейти на сайт</a> | <a href="${siteUrl}/privacy-policy">Политика конфиденциальности</a></p>
	       </div>
	   </div>
</body>
</html>
	`
	return sendEmail({ to: email, subject, html })
}

// Функция для отправки чека после успешной оплаты
export async function sendReceiptEmail(
	email: string,
	order: {
		id: string
		total: string
		items: Array<{
			title: string
			price: number
			quantity: number
			image?: string
		}>
		createdAt: string
	}
) {
	const subject = `Чек по заказу ${order.id}`
	const logoUrl = `${process.env.NEXTAUTH_URL}/images/logo-header.png`
	const siteUrl = process.env.NEXTAUTH_URL || 'https://arivoo-hazel.vercel.app/'
	const formattedDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})

	// Генерация строк таблицы товаров
	const itemsRows = order.items
		.map(
			item => `
		<tr>
			<td style="padding: 12px; border-bottom: 1px solid #eaeaea; vertical-align: top;">
				<div style="display: flex; align-items: center; gap: 12px;">
					${item.image ? `<img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />` : ''}
					<div>
						<strong style="color: #0f2332; font-size: 16px;">${item.title}</strong>
					</div>
				</div>
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: center; vertical-align: top;">
				${item.quantity} шт.
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: right; vertical-align: top;">
				${item.price.toLocaleString('ru-RU')} ₽
			</td>
			<td style="padding: 12px; border-bottom: 1px solid #eaeaea; text-align: right; vertical-align: top;">
				<strong>${(item.price * item.quantity).toLocaleString('ru-RU')} ₽</strong>
			</td>
		</tr>
	`
		)
		.join('')

	const totalAmount = parseFloat(order.total).toLocaleString('ru-RU')

	const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
	   <meta charset="UTF-8">
	   <meta name="viewport" content="width=device-width, initial-scale=1.0">
	   <title>Чек по заказу ${order.id}</title>
	   <style>
	       body {
	           font-family: 'Montserrat', Arial, Helvetica, sans-serif;
	           margin: 0;
	           padding: 0;
	           background-color: #f9f9f9;
	           color: #333;
	       }
	       .container {
	           max-width: 700px;
	           margin: 0 auto;
	           background-color: #ffffff;
	           border-radius: 16px;
	           overflow: hidden;
	           box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	       }
	       .header {
	           background-color: #0f2332;
	           padding: 30px 20px;
	           text-align: center;
	       }
	       .logo {
	           max-width: 180px;
	           height: auto;
	       }
	       .content {
	           padding: 40px 30px;
	       }
	       h1 {
	           color: #0f2332;
	           font-size: 28px;
	           margin-top: 0;
	           margin-bottom: 20px;
	           font-weight: 700;
	       }
	       .order-info {
	           background-color: #f5f5f5;
	           border-radius: 12px;
	           padding: 20px;
	           margin-bottom: 30px;
	       }
	       .order-info p {
	           margin: 8px 0;
	           font-size: 16px;
	       }
	       .order-info strong {
	           color: #0f2332;
	       }
	       table {
	           width: 100%;
	           border-collapse: collapse;
	           margin: 25px 0;
	       }
	       th {
	           background-color: #f0f0f0;
	           padding: 15px;
	           text-align: left;
	           font-weight: 700;
	           color: #0f2332;
	           border-bottom: 2px solid #ddd;
	       }
	       td {
	           padding: 12px;
	           border-bottom: 1px solid #eaeaea;
	           vertical-align: top;
	       }
	       tbody tr:nth-child(even) {
	           background-color: #f9f9f9;
	       }
	       .total-row {
	           background-color: #f9f9f9;
	           font-weight: 700;
	           font-size: 18px;
	       }
	       .button {
	           display: inline-block;
	           background: linear-gradient(to top, #0d65df 0%, #0752c2 100%);
	           color: #fff !important;
	           text-decoration: none;
	           padding: 14px 28px;
	           border-radius: 12px;
	           font-weight: 700;
	           font-size: 16px;
	           text-transform: capitalize;
	           margin: 25px 0;
	           transition: all 0.3s ease;
	           box-shadow: 0 4px 12px rgba(7, 82, 194, 0.3);
	           border: none;
	           cursor: pointer;
	           line-height: 1.2;
	           min-width: 200px;
	           text-align: center;
	           vertical-align: middle;
	       }
	       .button:hover {
	           background: linear-gradient(to top, #0a5bc8 0%, #0648a8 100%);
	           box-shadow: 0 6px 16px rgba(7, 82, 194, 0.4);
	           transform: translateY(-2px);
	       }
	       .footer {
	           background-color: #f5f5f5;
	           padding: 25px 30px;
	           text-align: center;
	           font-size: 14px;
	           color: #888;
	           border-top: 1px solid #eaeaea;
	       }
	       .footer a {
	           color: #0752c2;
	           text-decoration: none;
	       }
	       @media (max-width: 600px) {
	           .content {
	               padding: 30px 20px;
	           }
	           h1 {
	               font-size: 24px;
	           }
	           table {
	               font-size: 14px;
	           }
	       }
	   </style>
</head>
<body>
	   <div class="container">
	       <div class="header">
	           <img src="${logoUrl}" alt="Arivoo" class="logo" />
	       </div>
	       <div class="content">
	           <h1>✅ Спасибо за покупку!</h1>
	           <p>Ваш заказ успешно оплачен. Ниже приведена информация о заказе и чек.</p>
	           <p>Мы уже начали собирать ваш заказ. Вы получите уведомление, когда он будет отправлен.</p>

	           <div class="order-info">
	               <p><strong>Номер заказа:</strong> ${order.id}</p>
	               <p><strong>Дата и время:</strong> ${formattedDate}</p>
	               <p><strong>Статус:</strong> Оплачен</p>
	           </div>

	           <h2>Состав заказа</h2>
	           <table>
	               <thead>
	                   <tr>
	                       <th>Товар</th>
	                       <th style="text-align: center;">Количество</th>
	                       <th style="text-align: right;">Цена</th>
	                       <th style="text-align: right;">Сумма</th>
	                   </tr>
	               </thead>
	               <tbody>
	                   ${itemsRows}
	               </tbody>
	               <tfoot>
	                   <tr class="total-row">
	                       <td colspan="3" style="text-align: right; padding-right: 20px;"><strong>Итого:</strong></td>
	                       <td style="text-align: right;"><strong>${totalAmount} ₽</strong></td>
	                   </tr>
	               </tfoot>
	           </table>

	           <p style="text-align: center;">
	               <a href="${siteUrl}/user" class="button">Перейти в личный кабинет</a>
	           </p>

	           <p>Если у вас возникли вопросы, свяжитесь с нашей <a href="${siteUrl}/faq">службой поддержки</a>.</p>
	       </div>
	       <div class="footer">
	           <p>© ${new Date().getFullYear()} Arivoo. Все права защищены.</p>
	           <p><a href="${siteUrl}">Перейти на сайт</a> | <a href="${siteUrl}/privacy-policy">Политика конфиденциальности</a></p>
	       </div>
	   </div>
</body>
</html>
	`
	return sendEmail({ to: email, subject, html })
}
