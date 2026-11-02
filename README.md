<p align="center">
  <img src="StudentCouncil.Frontend/public/favicon.svg" width="100" alt="Логотип" />
</p>

<h1 align="center">Платформа студенческого совета СГН</h1>

<p align="center">
  Веб-приложение для управления студенческим советом: участники, мероприятия, бейджи, аналитика.
</p>

<p align="center">
  <a href="https://studsovetsgn.ru"><img src="https://img.shields.io/badge/studsovetsgn.ru-0CBFA1?style=flat-square" /></a>
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square" />
</p>


## О проекте

Внутренняя платформа для студенческого совета СГН МГТУ им. Н.Э. Баумана. Заменяет ручной учёт в таблицах и мессенджерах единой системой с ролевой моделью, геймификацией и аналитикой.

**Основные возможности:**

- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> **Пользователи:** учёт участников, роли (Admin / Leader / Member), система уровней и баллов.
- <img src="https://cdn.simpleicons.org/googlecalendar/0CBFA1" width="16" /> **Мероприятия:** создание, регистрация, учёт явки, бюджетирование.
- <img src="https://cdn.simpleicons.org/openbadges/0CBFA1" width="16" /> **Бейджи:** выдача цифровых подтверждений с возможностью загрузки PDF.
- <img src="https://cdn.simpleicons.org/chartdotjs/0CBFA1" width="16" /> **Аналитика:** дашборды со статистикой, топами и динамикой по месяцам.
- <img src="https://cdn.simpleicons.org/letsencrypt/0CBFA1" width="16" /> **Безопасность:** Cookie-аутентификация, поддержка 2FA (TOTP), защита от удаления последнего админа.

---

## Стек технологий

**Backend:**
- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> ASP.NET Core 8 (C#)
- <img src="https://cdn.simpleicons.org/postgresql/0CBFA1" width="16" /> PostgreSQL 16 (EF Core)

**Frontend:**
- <img src="https://cdn.simpleicons.org/react/0CBFA1" width="16" /> React 19 + Vite
- <img src="https://cdn.simpleicons.org/chartdotjs/0CBFA1" width="16" /> Chart.js (визуализация данных)

**Инфраструктура:**
- <img src="https://cdn.simpleicons.org/docker/0CBFA1" width="16" /> Docker + Docker Compose
- <img src="https://cdn.simpleicons.org/nginx/0CBFA1" width="16" /> Nginx (reverse proxy)
- <img src="https://cdn.simpleicons.org/ubuntu/0CBFA1" width="16" /> Ubuntu 22.04 (VPS)

---

## Архитектура

Проект представляет собой **слоистый монолит**. Backend разделён на три слоя:

- **`StudentCouncil.Data`** — модели, `AppDbContext`, миграции EF Core.
- **`StudentCouncil.Logic`** — DTO, бизнес-логика (сервисы), интерфейсы, кастомные исключения.
- **`StudentCouncil.Web`** — REST API контроллеры, middleware для обработки ошибок, настройка DI.
- **`StudentCouncil.Frontend`** — SPA на React (Vite), взаимодействует с API.

```mermaid
flowchart TD
    Client([Браузер / React SPA])

    subgraph VPS [VPS Ubuntu 22.04]
        Nginx[Nginx :443]
        Static[Раздача статики]

        subgraph Docker [Docker Network]
            API[ASP.NET Core :8080]
            DB[(PostgreSQL :5432)]
        end
    end

    Client <-->|HTTPS| Nginx
    Nginx --> Static
    Nginx <-->|HTTP| API
    API <--> DB

    style Client fill:#61DAFB,color:#000
    style Nginx fill:#009639,color:#fff
    style API fill:#512BD4,color:#fff
    style DB fill:#4169E1,color:#fff
```

---

## Локальный запуск

**Требования:** .NET 8 SDK, Node.js 20+, PostgreSQL 16 (или Docker Desktop).

### 1. Настройка базы данных
Создайте файл `StudentCouncil.Web/appsettings.Development.json` и укажите строку подключения к вашей локальной БД:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=studsovet;Username=postgres;Password=ваш_пароль"
  }
}
```

### 2. Запуск Backend

```bash
# Применить миграции
dotnet ef database update --project StudentCouncil.Data --startup-project StudentCouncil.Web

# Запустить сервер
dotnet run --project StudentCouncil.Web
```

API будет доступно по адресу: `http://localhost:8080` (Swagger: `/swagger`).

### 3. Запуск Frontend

```bash
cd StudentCouncil.Frontend
npm install
npm run dev
```
Сайт откроется на `http://localhost:5173`.

---

## Docker

Для запуска всего проекта одной командой используется Docker Compose.

```bash
# Создать .env файл с паролем для БД
echo "DB_PASSWORD=ваш_сложный_пароль" > .env

# Поднять контейнеры
docker compose up -d

# Посмотреть логи backend
docker logs studentcouncil_backend --tail 50
```

**Контейнеры:**

| Сервис | Порт | Назначение |
|--------|------|-----------|
| `postgres` | 127.0.0.1:5432 | PostgreSQL 16 |
| `backend` | 8080 | ASP.NET Core 8 |
| `frontend` | 8081 | Nginx со статикой React |

*Для сохранения данных используются Docker-volumes: `postgres_data` (БД), `backend_wwwroot` (файлы) и `backend_logs` (логи).*

---

## Документация API

- <img src="https://cdn.simpleicons.org/swagger/0CBFA1" width="16" /> [Swagger UI (GitHub Pages)](https://digital-sgn.github.io/StudentCouncilPlatform-API)
- <img src="https://cdn.simpleicons.org/openapiinitiative/0CBFA1" width="16" /> [openapi.yaml](openapi.yaml) — спецификация в репозитории
- Локально в dev-режиме: `http://localhost:8080/swagger`

---

## Ссылки

- <img src="https://cdn.simpleicons.org/googlechrome/0CBFA1" width="16" /> Сайт: [studsovetsgn.ru](https://studsovetsgn.ru)
- <img src="https://cdn.simpleicons.org/github/0CBFA1" width="16" /> Справочник отдела: [Handbook](https://github.com/Digital-SGN/Handbook)
- <img src="https://cdn.simpleicons.org/github/0CBFA1" width="16" /> Организация на GitHub: [Digital-SGN](https://github.com/Digital-SGN)

<br/>

<p align="center">
  <sub>Отдел цифрового развития ССФ СГН · 2026</sub>
</p>
