<p align="center">
  <img src="assets/logo.svg" width="100" alt="Логотип" />
</p>

<h1 align="center">Платформа студенческого совета СГН</h1>

<p align="center">
  Веб-приложение для управления студенческим советом: участники, мероприятия, бейджи, аналитика.
</p>

<p align="center">
  <a href="https://studsovetsgn.ru"><img src="https://img.shields.io/badge/studsovetsgn.ru-0CBFA1" /></a>
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

##  Документация API

- [Swagger UI](https://digital-sgn.github.io/StudentCouncilPlatform-AP)
- [openapi.yaml](openapi.yaml) — спецификация в репозитории
- Swagger в dev-режиме: `http://localhost:8080/swagger`

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

---

## Локальный запуск

---

## Docker

---


## Ссылки

- Сайт: [studsovetsgn.ru](https://studsovetsgn.ru)
- Справочник отдела: [Handbook](https://github.com/Digital-SGN/Handbook)
- Организация на GitHub: [Digital-SGN](https://github.com/Digital-SGN)

---

<p align="center">
  <sub>Отдел цифрового развития ССФ СГН · 2026</sub>
</p>
