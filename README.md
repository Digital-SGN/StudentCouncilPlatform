<p align="center">
  <img src="https://github.com/Digital-SGN/Handbook/blob/main/assets/logo_council_platform.png" width="160" alt="Логотип" />
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
  <img src="https://img.shields.io/badge/License-Internal-red?style=flat-square" />
</p>

<p align="center">
  <img width="700" height="362" alt="preview" src="https://github.com/user-attachments/assets/4f4f5986-958b-4740-8f68-d19764fcc490" />
</p>

## О проекте

Внутренняя платформа для студенческого совета СГН МГТУ им. Н.Э. Баумана. Заменяет ручной учёт в таблицах и мессенджерах единой системой с ролевой моделью, геймификацией и аналитикой.

**Основные возможности:**

- <img src="https://cdn.simpleicons.org/shieldsdotio/0CBFA1" width="16" /> **Ролевая модель (RBAC):** Гибкое разграничение прав (Admin, Leader, Member) на уровне API и интерфейса.
- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> **Пользователи:** учёт участников, роли, система уровней и баллов.
- <img src="https://cdn.simpleicons.org/googlecalendar/0CBFA1" width="16" /> **Мероприятия:** создание, регистрация, учёт явки, бюджетирование.
- <img src="https://cdn.simpleicons.org/openbadges/0CBFA1" width="16" /> **Бейджи:** выдача цифровых подтверждений с возможностью загрузки PDF.
- <img src="https://cdn.simpleicons.org/chartdotjs/0CBFA1" width="16" /> **Аналитика:** дашборды со статистикой, топами и динамикой по месяцам.
- <img src="https://cdn.simpleicons.org/letsencrypt/0CBFA1" width="16" /> **Безопасность:** Cookie-аутентификация, **вход по OTP-коду на почту**, опциональная 2FA (TOTP), защита от брутфорса (Lockout).
- <img src="https://api.iconify.design/fa6-solid/trophy.svg?color=%230CBFA1" width="16" /> **Геймификация:** Система уровней (XP), баланс баллов, кастомные баннеры профиля.

---

## Стек технологий

**Backend:**
- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> ASP.NET Core 8 (C#)
- <img src="https://cdn.simpleicons.org/postgresql/0CBFA1" width="16" /> PostgreSQL 16 (EF Core)
- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> xUnit, EF Core InMemory (тестирование)

**Frontend:**
- <img src="https://cdn.simpleicons.org/react/0CBFA1" width="16" /> React 19 + Vite
- <img src="https://cdn.simpleicons.org/chartdotjs/0CBFA1" width="16" /> Chart.js (визуализация данных)

**Инфраструктура:**
- <img src="https://cdn.simpleicons.org/docker/0CBFA1" width="16" /> Docker + Docker Compose
- <img src="https://cdn.simpleicons.org/nginx/0CBFA1" width="16" /> Nginx (reverse proxy)
- <img src="https://cdn.simpleicons.org/ubuntu/0CBFA1" width="16" /> Ubuntu 22.04 (VPS)

---

## Архитектура
<img width="2160" height="1380" src="https://github.com/Digital-SGN/Handbook/blob/main/assets/student-council-architecture%20(2).png" />


Проект представляет собой **слоистый монолит**. Backend разделён на три слоя:

- **`StudentCouncil.Data`** — сущности, `AppDbContext` и миграции EF Core.
- **`StudentCouncil.Logic`** — DTO, сервисы, интерфейсы, Identity-сценарии, почтовая отправка и кастомные исключения.
- **`StudentCouncil.Web`** — REST API-контроллеры, middleware обработки ошибок и настройка DI.
- **`StudentCouncil.Frontend`** — SPA на React, взаимодействующее с backend API.
- **`StudentCouncil.Tests`** — unit-тесты сервисов с xUnit и EF Core InMemory.

---

## Локальный запуск

**Требования:** .NET 8 SDK, Node.js 20+, PostgreSQL 16 (или Docker Desktop).

### 1. Настройка базы данных и почты

Создайте файл `StudentCouncil.Web/appsettings.Development.json` и укажите настройки подключения к вашей локальной БД, данные для отправки тестовых писем, а также разрешённые источники для CORS:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=база_данных;Username=ваш_юзернейм;Password=ваш_пароль"
  },
  "Smtp": {
    "Host": "ваш_хост",
    "Port": 465,
    "UseStartTls": false,
    "User": "ваша_почта@example.com",
    "Password": "ваш_пароль_от_почты"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5174"
    ]
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

## Тестирование

Backend-тесты используют xUnit и EF Core InMemory. Они проверяют основные сценарии сервисов:

- вход и получение профиля пользователя;
- права пользователя на изменение других профилей;
- создание и обновление пользователей;
- создание и обновление мероприятий;
- получение публичных мероприятий;
- создание, изменение, удаление и скачивание бейджей;
- обработку удалённых мероприятий и дубликатов.

Запуск всех тестов:

```bash
dotnet test StudentCouncil.Tests/StudentCouncil.Tests.csproj
```

Проверка сборки всего решения:

```bash
dotnet build
```

---

## Docker

Для запуска всего проекта одной командой используется Docker Compose.

```bash
# Создать .env файл с паролем для БД
echo "DB_PASSWORD=ваш_сложный_пароль" > .env
echo "SMTP_PASSWORD=пароль_от_почты" >> .env

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

## Деплой

Деплой автоматизирован через GitHub Actions:

- при PR в `main` workflow запускает restore/build backend и frontend;
- все unit-тесты выполняются до деплоя;
- после push в `main` workflow подключается к VPS по SSH;
- на сервере обновляются Docker-контейнеры backend/frontend, статические файлы копируются в каталог Nginx, после чего Nginx перезагружается.

<img src="https://github.com/Digital-SGN/Handbook/blob/main/assets/deploy-pipeline-architecture.png" />

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

## Лицензия

Проект разработан для внутреннего использования ССФ СГН МГТУ им. Н.Э. Баумана. 
Код открыт для ознакомления. Коммерческое использование без согласия запрещено.

<p align="center">
  <sub>Отдел цифрового развития ССФ СГН · 2026</sub>
</p>
