-- Создание таблиц для Neon PostgreSQL
-- Выполните этот скрипт в редакторе SQL Neon Console

-- Пользователь
CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL,
    password TEXT,
    phone TEXT,
    address_data TEXT, -- JSON с адресом: {lastName, patronymic, city, address, addressExtra}
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- История действий пользователя
CREATE TABLE user_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'view_product', 'add_to_favorites', 'remove_from_favorites', 'add_to_cart', 'remove_from_cart', 'create_order'
    product_id TEXT,
    product_title TEXT,
    product_price TEXT,
    product_image TEXT,
    details TEXT, -- дополнительные детали
    created_at TIMESTAMP NOT NULL
);

-- Заказы
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    total TEXT NOT NULL,
    items TEXT NOT NULL, -- JSON массив товаров
    tracking_number TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Сессия
CREATE TABLE session (
    id TEXT PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

-- Аккаунт (OAuth)
CREATE TABLE account (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at TIMESTAMP,
    refresh_token_expires_at TIMESTAMP,
    scope TEXT,
    password TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Верификация
CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Сессия поиска по изображению
CREATE TABLE image_search_session (
    id TEXT PRIMARY KEY,
    results TEXT NOT NULL,
    image_ids TEXT,
    sources TEXT NOT NULL,
    page_size INTEGER NOT NULL,
    current_page INTEGER NOT NULL,
    total_pages INTEGER,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Индексы (опционально, но улучшают производительность)
CREATE INDEX idx_user_history_user_id ON user_history(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_session_user_id ON session(user_id);
CREATE INDEX idx_account_user_id ON account(user_id);