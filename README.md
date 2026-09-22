<p align="center">
  <img src="assets/logo.svg" width="100" alt="Логотип" />
</p>

<h1 align="center">Платформа студенческого совета СГН</h1>

<p align="center">
  Веб-приложение для управления студенческим советом: участники, мероприятия, бейджи, аналитика.
</p>

<p align="center">
  <a href="https://studsovetsgn.ru"><img src="https://img.shields.io/badge/сайт-studsovetsgn.ru-0CBFA1" /></a>
  <img src="https://img.shields.io/badge/.NET-8.0-512BD4" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED" />
</p>

---

## О проекте

Внутренняя платформа для студенческого совета СГН МГТУ им. Н.Э. Баумана. Заменяет ручной учёт в таблицах и мессенджерах единой системой с ролевой моделью, геймификацией и аналитикой.

**Что умеет:**

- Учёт участников с ролями (Admin / Leader / Member)
- Организация мероприятий: регистрация, явка, бюджет
- Выдача бейджей с PDF-подтверждением
- Аналитика: статистика, топы, динамика по месяцам
- Двухфакторная аутентификация (TOTP)

---

## Структура

```text
StudentCouncil/
├── StudentCouncil.Data/      # DbContext, модели, миграции
├── StudentCouncil.Logic/     # DTO, интерфейсы, сервисы
├── StudentCouncil.WebApi/    # Контроллеры, Program.cs, wwwroot
├── StudentCouncil.Frontend/  # React SPA (Vite)
├── docker-compose.yml
├── Dockerfile
└── openapi.yaml
```

## Стек

**Backend**  
![C#](https://img.shields.io/badge/C%23-239120?logo=c-sharp&logoColor=white)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core_8-512BD4?logo=.net&logoColor=white)
![EF Core](https://img.shields.io/badge/EF_Core-512BD4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

**Frontend**  
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-7952B3?logo=bootstrap&logoColor=white)

**Инфраструктура**  
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu_22.04-E95420?logo=ubuntu&logoColor=white)

---

## Архитектура

**Слоистый монолит.** Один backend-процесс, три слоя:

```
StudentCouncil.WebApi   ← контроллеры, HTTP
       ↓
StudentCouncil.Logic    ← сервисы, DTO, бизнес-логика
       ↓
StudentCouncil.Data     ← EF Core, модели, миграции
       ↓
    PostgreSQL
```

Frontend — отдельное SPA на React, общается с backend по REST API.

---

## Локальный запуск

**Требования:** .NET 8 SDK, Node.js 20+, PostgreSQL 16 (или Docker).

```bash
# 1. Backend
dotnet ef database update --project StudentCouncil.Data --startup-project StudentCouncil.WebApi
dotnet run --project StudentCouncil.WebApi

# 2. Frontend (в отдельном терминале)
cd StudentCouncil.Frontend
npm install
npm run dev
```

Сайт откроется на `http://localhost:5173`, API — на `http://localhost:8080`.

Подробнее — в [справочнике отдела](https://github.com/<org>/digital-department-handbook).

---

## Docker

```bash
docker-compose up -d
```

Поднимает backend и PostgreSQL. Nginx на хосте раздаёт статику и проксирует `/api`.

---

## Документация API

Swagger UI доступен в dev-режиме: `http://localhost:8080/swagger`

Спецификация: [`openapi.yaml`](openapi.yaml)

---

## Ссылки

- Сайт: [studsovetsgn.ru](https://studsovetsgn.ru)
- Справочник отдела: [digital-department-handbook](https://github.com/<org>/digital-department-handbook)
- Организация на GitHub: [github.com/&lt;org&gt;](https://github.com/<org>)

---

<p align="center">
  <sub>Отдел цифрового развития ССФ СГН · 2026</sub>
</p>
