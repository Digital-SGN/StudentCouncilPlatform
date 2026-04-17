# StudentCouncil.Logic

Слой бизнес-логики. Содержит DTO, интерфейсы сервисов, реализации и вспомогательные классы.

## Структура

- `DTOs/` — объекты передачи данных
- `Interfaces/` — контракты сервисов
- `Services/` — реализации сервисов
- `Mapper.cs` — преобразование Entity ↔ DTO
- `ServiceResult.cs` — унифицированный ответ сервисов

## Cервисы

| Сервис | Назначение |
|--------|------------|
| `UserService` | Управление пользователями, ролями, аватарами, блокировка |
| `EventService` | CRUD мероприятий, назначение ответственных |
| `BadgeService` | Выдача бейджей участникам, загрузка/скачивание PDF |
| `FileStorageService` | Сохранение файлов, проверка magic bytes (PDF, JPEG, PNG, GIF), лимит 10 МБ |
| `FileLoggerService` | Асинхронное неблокирующее логирование через Channel<T> |

## ServiceResult

Унифицированный контейнер ответа сервисов:

```csharp
ServiceResult<UserDTO>.Ok(data)
ServiceResult.NotFound("Пользователь не найден")
ServiceResult.Forbidden("Доступ запрещён")

BaseController.HandleServiceResult() автоматически преобразует в HTTP-ответ с правильным статус-кодом.
```
