# StudentCouncil.Logic

Слой бизнес-логики. Содержит DTO, интерфейсы сервисов, реализации и вспомогательные классы.

## Структура

- `DTOs/` — объекты передачи данных
- `Interfaces/` — контракты сервисов
- `Services/` — реализации сервисов
- `Mapper.cs` — преобразование Entity ↔ DTO
- `ServiceResult.cs` — унифицированный ответ сервисов

## Сервисы

| Сервис | Файл |
|--------|------|
| `IUserService` | `UserService.cs` |
| `IEventService` | `EventService.cs` |
| `IBadgeService` | `BadgeService.cs` |
| `IFileStorageService` | `FileStorageService.cs` |
| `ILoggerService` | `FileLoggerService.cs` |
