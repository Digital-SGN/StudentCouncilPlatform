# StudentCouncil.Web

Веб-слой — ASP.NET Core API.

## Основные файлы

- `Program.cs` — конфигурация приложения, DI, middleware
- `Controllers/` — API-контроллеры
- `wwwroot/` — статические файлы (avatars/, badges/)

## Контроллеры

| Контроллер | Маршрут |
|------------|---------|
| `AccountController` | `/api/account` |
| `UserController` | `/api/users` |
| `EventController` | `/api/events` |
| `BadgeController` | `/api/badges` |

## Конфигурация

- CORS разрешён для `http://localhost:5173`
- Cookie-аутентификация с JSON-ответами 401/403
