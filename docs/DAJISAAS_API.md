# Dajisaas API Documentation (на русском языке)

## Обзор

Dajisaas — это платформа для работы с китайскими маркетплейсами (1688, Taobao/Tmall, Poizon). API предоставляет доступ к поиску товаров, работе с
заказами, расчету доставки и другим функциям.

**Базовый URL:** `https://openapi.dajisaas.com`

---

## 1. Языки (country)

Параметр `country` используется для многоязычного ответа:

| Код | Язык          |
| --- | ------------- |
| en  | Английский    |
| ru  | Русский       |
| vi  | Вьетнамский   |
| ja  | Японский      |
| ko  | Корейский     |
| fr  | Французский   |
| pt  | Португальский |
| es  | Испанский     |
| th  | Тайский       |
| id  | Индонезийский |
| ar  | Арабский      |

---

## 2. Фильтры поиска (1688)

Параметр `filter` — строка с фильтрами через запятую:

### Рейтинг продавца

- `totalEpScoreLv1` — 5 звезд
- `totalEpScoreLv2` — 4.5-5.0 звезд
- `totalEpScoreLv3` — 4-4.5 звезд
- `totalEpScoreLv4` — ниже 4 звезд

### Скорость отправки

- `shipIn24Hours` — отправка за 24 часа
- `shipIn48Hours` — отправка за 48 часов
- `shipInToday` — отправка в тот же день
- `getRate24HLv1` — скорость отправки <95%
- `getRate24HLv2` — скорость отправки ≥95%
- `getRate24HLv3` — скорость отправки ≥99%

### Особенности товара

- `certifiedFactory` — проверенный завод
- `1688Selection` — 1688严选 (официальная проверка)
- `jxhy` —分销严选
- `noReason7DReturn` — 7 дней на возврат без причины
- `isOnePsale` — поддержка дропшиппинга
- `isOnePsaleFreePostage` — дропшиппинг с бесплатной доставкой
- `new7` — новинки за 7 дней
- `new30` — новинки за 30 дней
- `isQqyx` —全球严选 (глобальный отбор)
- `isSelect` —跨境select货盘

---

## 3. Сортировка (sort)

Параметр `sort` — JSON объект:

```json
{"price": "asc"}      // по цене (asc — по возрастанию, desc — по убыванию)
{"rePurchaseRate": "desc"}  // по повторным покупкам
{"monthSold": "desc"}       // по месячным продажам
```

---

## 4. Рейтинги (rankType)

Параметр для категорий товаров:

- `complex` — 综合榜 (общий рейтинг)
- `hot` — 热销榜 (хиты продаж)
- `goodPrice` — 好价榜 (лучшая цена)
- `anchorHot` — 主播热卖榜
- `anchorNew` — 主播新兴榜
- `anchorRecommend` — 主播热推榜
- `VNHot` — 越南热销 (Вьетнам хиты)
- `VNTrend` — 越南趋势 (Вьетнам тренды)

---

## 5. API 1688 (alibaba)

### 5.1 Поиск товаров по ключевым слову

**Endpoint:** `POST /alibaba/product/keywordQuery`

**Параметры:**

- `keyword` — ключевое слово для поиска
- `beginPage` — номер страницы (начиная с 1)
- `pageSize` — количество результатов (макс 20)
- `filter` — фильтры (см. раздел 2)
- `sort` — сортировка (см. раздел 3)
- `country` — язык ответа (ru, en, vi и т.д.)

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"totalRecords": 2000,
		"totalPage": 101,
		"currentPage": 1,
		"data": [
			{
				"offerId": "123456789",
				"subject": "Название товара",
				"subjectTrans": "Переведенное название",
				"imageUrl": "https://...",
				"priceInfo": {
					"price": "34.50",
					"consignPrice": "34.50",
					"jxhyPrice": "34.50"
				},
				"monthSold": 3911,
				"repurchaseRate": "5%",
				"isOnePsale": true,
				"isJxhy": true
			}
		]
	}
}
```

---

### 5.2 Поиск товаров по изображению

**Шаг 1: Загрузка изображения**

**Endpoint:** `POST /alibaba/upload/image`

**Параметры (multipart/form-data):**

- `image_base64` — изображение в Base64 (JPG, PNG, WEBP, макс 3MB)

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"imageId": "1164408192156408878"
	}
}
```

**Шаг 2: Поиск по imageId**

**Endpoint:** `POST /alibaba/product/imageQuery`

**Параметры:**

- `imageId` — ID изображения из шага 1

---

### 5.3 Детали товара

**Endpoint:** `POST /alibaba/product/queryProductDetail`

**Параметры:**

- `offerId` — ID товара
- `country` — язык ответа

**Ответ включает:**

- `subject` / `subjectTrans` — название товара
- `description` — HTML описание
- `productImage` — массив изображений
- `productAttribute` — атрибуты (цвет, размер, материал и т.д.)
- `productSkuInfos` — варианты товара (SKU) с ценами и остатками

---

### 5.4 Стоимость доставки

**Endpoint:** `POST /alibaba/product/freight`

**Параметры:**

- `offerId` — ID товара

**Ответ:**

```json
{
  "code": 200,
  "data": {
    "offerId": "670291644950",
    "freight": "3.50",
    "templateName": "中通",  // Название службы доставки
    "firstFee": "3.5",       // Первая единица веса
    "nextFee": "2.5",        // За каждую следующую единицу
    "productFreightSkuInfoModels": [...] // Информация по каждому SKU
  }
}
```

---

### 5.5 Предпросмотр заказа

**Endpoint:** `POST /alibaba/trade/order/preview`

**Параметры:**

- `offerId` — ID товара
- `skuId` — ID варианта
- `quantity` — количество

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"orderPreviewResuslt": [
			{
				"sumPayment": 1671, // Итоговая сумма
				"sumCarriage": 350, // Стоимость доставки
				"tradeModeNameList": ["assureTrade"], // Тип сделки
				"payChannelInfos": [{ "name": "alipay" }, { "name": "shegou", "amountLimit": 30000 }]
			}
		]
	}
}
```

---

### 5.6 Подтверждение получения заказа

**Endpoint:** `POST /alibaba/trade/order/confirmReceipt`

**Параметры:**

- `orderId` — ID заказа

---

### 5.7 Категории товаров

**Endpoint:** `POST /alibaba/category/get`

**Параметры:**

- `parentCategoryId` — ID родительской категории (опционально)

---

## 6. API Taobao/Tmall

### 6.1 Поиск товаров по ключевому слову

**Endpoint:** `POST /taobao/traffic/item/search`

**Параметры:**

- `keyword` — ключевое слово
- `page_no` — номер страницы
- `page_size` — количество на странице (макс 20)
- `sort` — сортировка
- `filter` — фильтры
- `country` — язык ответа

---

### 6.2 Поиск товаров по изображению

**Шаг 1: Загрузка изображения**

**Endpoint:** `POST /taobao/upload/image`

**Параметры:**

- `image_base64` — изображение в Base64

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"imageId": "..."
	}
}
```

**Шаг 2: Поиск по imageId**

**Endpoint:** `POST /taobao/traffic/item/imgsearch`

**Параметры:**

- `image_id` — ID изображения
- `language` — язык (en или vi)

---

### 6.3 Поиск по URL изображения (V2)

**Endpoint:** `GET /taobao/image-search/url`

**Параметры:**

- `picUrl` — URL изображения
- `categoryId` — категория (0-одежда, 1-платья, 2-брюки, 3-сумки, 4-обувь, 5-аксессуары, 6-сладости, 7-косметика, 8-напитки, 9-мебель, 20-игрушки,
  21-белье, 22-техника, 88888888-другое)
- `pageNo` — номер страницы (0-499)
- `pageSize` — количество (1-20)
- `crop` — выделение главного объекта (true/false)

---

### 6.4 Детали товара

**Endpoint:** `POST /taobao/traffic/item/get`

**Параметры:**

- `item_id` — ID товара
- `language` — язык ответа

---

### 6.5 Стоимость доставки

**Endpoint:** `POST /taobao/traffic/item/logisticPrice/get`

**Параметры (JSON):**

```json
{
	"item_id": "703446760426",
	"address_info": "{\"country\": \"中国\", \"city\": \"杭州市\", \"district\": \"余杭区\", \"state\": \"浙江省\"}"
}
```

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"postFee": 0,
		"currency": "CNY"
	}
}
```

---

### 6.6 Предпросмотр заказа

**Endpoint:** `POST /taobao/purchase/order/render`

**Параметры:**

- `receiver_address` — адрес получателя
- `warehouse_address` — адрес склада
- `render_item_List` — JSON массив товаров `[{"itemId": "...", "quantity": "1", "skuId": "..."}]`

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"result": {
			"data": {
				"totalRealPayPrice": { "amount": 1260, "currency": "CNY" },
				"mainlandShippingFee": { "amount": 0, "currency": "CNY" },
				"orderFee": { "amount": 1480, "currency": "CNY" }
			}
		}
	}
}
```

---

### 6.7 Создание заказа

**Endpoint:** `POST /taobao/purchase/order/create`

**Параметры:**

- `thirdOrderId` — ваш ID заказа
- `purchase_amount` — сумма покупки
- `seller_order_number` — номер заказа продавца
- `order_source` — источник (lazada, shopee и т.д.)
- `order_line_list` — JSON массив товаров
- `receiver` — данные получателя
- `warehouse_address_info` — адрес склада

---

### 6.8 Поиск магазинов

**Endpoint:** `POST /taobao/traffic/item/shop/search`

**Параметры:**

- `keyword` — ключевое слово для поиска магазина

---

### 6.9 Темы/Категории

**Получение списка тем:** **Endpoint:** `POST /taobao/traffic/getThemeDimList`

**Параметры:**

- `themeType` — тип темы (опционально)

**Получение товаров темы:** **Endpoint:** `POST /taobao/traffic/getThemeDetail`

**Параметры:**

- `themeId` — ID темы
- `page_no` — номер страницы
- `page_size` — количество

---

## 7. API Poizon

### 7.1 Поиск товаров

**Endpoint:** `POST /poizon/product/queryList`

**Параметры:**

- `distSpuTitle` — название на английском
- `dwSpuTitle` — название на китайском
- `distBrandName` — бренд
- `startId` — ID для пагинации
- `pageSize` — количество (1-20)

**Ответ:**

```json
{
  "code": 200,
  "data": {
    "total": 984061,
    "spuList": [
      {
        "dwSpuId": 81971,
        "distSpuTitle": "Alexander McQueen Oversized...",
        "distBrandName": "Alexander McQueen",
        "authPrice": 604700,  // Цена в юанях (копейки)
        "image": "https://...",
        "baseImage": [...],
        "distCategoryl1Name": "Shoes",
        "distCategoryl2Name": "Trendy Sneakers",
        "distCategoryl3Name": "Casual Shoes",
        "sales": 0,
        "material": "кожа",
        "season": "春,夏,秋,冬"
      }
    ]
  }
}
```

---

### 7.2 Детали товара

**Endpoint:** `POST /poizon/product/queryDetail`

**Параметры:**

- `dwSpuId` — ID товара
- `dwDesignerId` — ID дизайна (опционально)

**Ответ:**

```json
{
	"code": 200,
	"data": {
		"dwSpuTitle": "Nike Cortez 经典时尚运动...",
		"distSpuTitle": "Nike Cortez White/Blue Women's",
		"image": "https://cdn.poizon.com/...",
		"distCategoryl3Name": "Running shoes",
		"skuList": [
			{
				"dwSkuId": 654517365,
				"distSkuId": "e41632d8-e778-4ae0-a6e6-8eb050e2ce5a",
				"minBidPrice": 0, // Минимальная цена (в юанях, копейки)
				"barcode": "197594916289",
				"skuLink": "https://www.dewu.com/product-detail.html?spuId=9042006&skuId=654517365",
				"saleAttr": [
					{ "cnName": "颜色", "enName": "Color", "cnValue": "白蓝", "enValue": "White Blue" },
					{ "cnName": "尺码", "enName": "Size", "cnValue": "36", "enValue": "36" }
				]
			}
		]
	}
}
```

**Особенности Poizon:**

- `minBidPrice` — минимальная цена продажи (в юанях, нужно делить на 100)
- `barcode` — штрих-код товара
- `distSkuId` — ID SKU в системе Poizon
- `dwSkuId` — внутренний ID SKU
- `saleAttr` — атрибуты продажи (цвет, размер)

---

### 7.3 Категории товаров

**Endpoint:** `POST /poizon/category/get`

**Параметры:**

- `parentId` — ID родительской категории (опционально)

**Ответ:**

```json
{
	"code": 200,
	"data": [
		{
			"id": 1,
			"name": "Shoes",
			"parentId": 0,
			"level": 1
		}
	]
}
```

---

### 7.4 Бренды

**Endpoint:** `POST /poizon/brand/get`

**Параметры:**

- `categoryId` — ID категории (опционально)
- `name` — название бренда (опционально, для поиска)

**Ответ:**

```json
{
	"code": 200,
	"data": [
		{
			"id": 1005011,
			"name": "Nike",
			"logo": "https://...",
			"country": "美国"
		}
	]
}
```

---

### 7.5 Поиск по штрих-коду

**Endpoint:** `POST /poizon/product/queryByBarcode`

**Параметры:**

- `barcode` — штрих-код товара

---

## 8. Подпись API (sign)

### Стандартный метод

1. Удалить поле `sign` из параметров
2. Отсортировать ключи по алфавиту
3. Создать строку: `key1=value1&key2=value2&...&secret=YOUR_SECRET`
4. Вычислить MD5 и преобразовать в верхний регистр

### Упрощенный метод (для POST-JSON)

Добавить поле `requestTime` (timestamp) в тело запроса вместо подписи.

---

## 9. Типы данных

### Адрес получателя (receiver_address)

```json
{
	"country": "Россия",
	"state": "Московская область",
	"city": "Москва",
	"district": "Центральный округ",
	"address": "ул. Примерная 1",
	"zip": "000000",
	"name": "Иван Иванов",
	"phone": "+79000000000",
	"mobile_phone": "+79000000000"
}
```

### Список товаров в заказе

```json
[
	{
		"itemId": "2048153758314474",
		"quantity": "1",
		"skuId": "3357413213162"
	}
]
```

---

## 10. Коды ошибок

| Код  | Описание             |
| ---- | -------------------- |
| 200  | Успешно              |
| 400  | Неверный запрос      |
| 401  | Не авторизован       |
| 500  | Ошибка сервера       |
| 1009 | Ошибка бизнес-логики |

---

## 11. Примеры использования

### Поиск товара на 1688

```typescript
const result = await dajiFetch('/alibaba/product/keywordQuery', {
	method: 'POST',
	params: {
		keyword: 't-shirt',
		beginPage: 1,
		pageSize: 20,
		country: 'ru'
	}
})
```

### Поиск по изображению (1688)

```typescript
// 1. Загрузить изображение
const uploadResult = await dajiFetch('/alibaba/upload/image', {
	method: 'POST',
	params: { image_base64: base64String }
})
const imageId = uploadResult.data.imageId

// 2. Поиск по imageId
const searchResult = await dajiFetch('/alibaba/product/imageQuery', {
	method: 'POST',
	params: { imageId }
})
```

### Получить детали товара

```typescript
const details = await dajiFetch('/alibaba/product/queryProductDetail', {
	method: 'POST',
	params: {
		offerId: '670291644950',
		country: 'ru'
	}
})
```
