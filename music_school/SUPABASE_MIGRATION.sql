-- Добавление колонки account_id и связи с таблицей accounts
alter table public.students
add column if not exists account_id uuid references public.accounts(id) on delete cascade;

-- При необходимости сразу сделать account_id обязательным, если все строки привязаны к аккаунтам
-- alter table public.students
-- alter column account_id set not null;
