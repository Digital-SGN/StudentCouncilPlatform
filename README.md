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
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/3a99b28a-564e-42c2-9ee2-0f2fdd68d2c8" controls width="85%"></video>
</p>

## О проекте

Внутренняя платформа для студенческого совета СГН МГТУ им. Н.Э. Баумана. Заменяет ручной учёт в таблицах и мессенджерах единой системой с ролевой моделью, геймификацией и аналитикой.

**Основные возможности:**

- <img src="https://cdn.simpleicons.org/dotnet/0CBFA1" width="16" /> **Пользователи:** учёт участников, роли, система уровней и баллов.
- <img src="https://cdn.simpleicons.org/googlecalendar/0CBFA1" width="16" /> **Мероприятия:** создание, регистрация, учёт явки, бюджетирование.
- <img src="https://cdn.simpleicons.org/openbadges/0CBFA1" width="16" /> **Бейджи:** выдача цифровых подтверждений с возможностью загрузки PDF.
- <img src="https://cdn.simpleicons.org/chartdotjs/0CBFA1" width="16" /> **Аналитика:** дашборды со статистикой, топами и динамикой по месяцам.
- <img src="https://cdn.simpleicons.org/letsencrypt/0CBFA1" width="16" /> **Безопасность:** Cookie-аутентификация, поддержка 2FA (TOTP).

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
- **`StudentCouncil.Frontend`** — SPA на React, взаимодействует с API.

```mermaid
flowchart TD
    User([Пользователь])
    
    subgraph VPS ["VPS (Ubuntu 22.04)"]
        Nginx["Nginx"]
        
        subgraph Docker ["Docker Network"]
            Frontend["React SPA<br/>(Frontend)"]
            Backend["ASP.NET Core<br/>(Backend)"]
            
            subgraph Storage ["Хранилище"]
                DB[("PostgreSQL")]
                Vol[("Docker Volume")]
            end
        end
    end

    User -->|HTTPS| Nginx
    Nginx -->|Отдаёт сайт| Frontend
    Nginx <-->|/api| Backend
    
    Backend <-->|EF Core| DB
    Backend <-->|Чтение/Запись| Vol

    classDef user fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef infra fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;
    classDef frontend fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;
    classDef backend fill:#ccfbf1,stroke:#0d9488,stroke-width:2px,color:#115e59;
    classDef db fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#312e81;
    classDef vol fill:#ffe4e6,stroke:#f43f5e,stroke-width:2px,color:#881337;

    class User user;
    class Nginx infra;
    class Frontend frontend;
    class Backend backend;
    class DB db;
    class Vol vol;
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

## Деплой

```mermaid
flowchart LR
    Dev([Разработчик]) -->|git push| GitHub[(GitHub)]
    GitHub -->|SSH| VPS[VPS Сервер]
    
    subgraph Script ["Скрипт deploy.sh"]
        direction LR
        Step1[1. git pull] --> Step2[2. Docker build] --> Step3[3. Docker up] --> Step4[4. Reload Nginx]
    end
    
    VPS --> Script

    %% Стили
    classDef dev fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f;
    classDef git fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155;
    classDef vps fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0c4a6e;
    classDef step fill:#ccfbf1,stroke:#0d9488,stroke-width:2px,color:#115e59;

    class Dev dev;
    class GitHub git;
    class VPS vps;
    class Step1,Step2,Step3,Step4 step;
```

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
