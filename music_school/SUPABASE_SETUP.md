# Supabase Tables Setup

В Supabase нужно создать две таблицы: `accounts` и `students`.

## Таблица `accounts`

Колонки:
- `id` — type: `uuid`, default: `gen_random_uuid()`, primary key.
- `username` — type: `text`, unique.
- `password` — type: `text`.
- `auth_token` — type: `text`.
- `created_at` — type: `timestamp with time zone`, default: `now()`.

SQL для создания:

```sql
create extension if not exists "pgcrypto";

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,
  auth_token text,
  created_at timestamptz not null default now()
);
```

## Таблица `students`

Колонки:
- `id` — type: `uuid`, default: `gen_random_uuid()`, primary key.
- `name` — type: `text`.
- `instrument` — type: `text`.
- `notes` — type: `text`.
- `account_id` — type: `uuid`, foreign key references `accounts(id)`.
- `created_at` — type: `timestamp with time zone`, default: `now()`.

SQL для создания:

```sql
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instrument text,
  notes text,
  account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now()
) tablespace pg_default;
```

Если таблица `students` уже создана без `account_id`, добавьте колонку и ограничение так:

```sql
alter table public.students
add column account_id uuid not null references public.accounts(id) on delete cascade;
```

Если у вас есть существующие строки без привязки к аккаунту, сначала создайте колонку как nullable, заполните значения и затем установите `not null`:

```sql
alter table public.students
add column account_id uuid references public.accounts(id) on delete cascade;

-- заполните account_id для существующих учеников вручную

alter table public.students
alter column account_id set not null;
```

## Важно

- Пароли хранятся в открытом виде по вашему запросу.
- Токены авторизации генерируются динамически при входе и сохранены в поле `auth_token`.
- `students` привязаны к `accounts` через `account_id`.
- В `app.js` запросы идут через `Authorization: Bearer <token>`.
