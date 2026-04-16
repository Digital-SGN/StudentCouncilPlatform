# StudentCouncil.Data

Слой доступа к данным. Содержит контекст БД, модели сущностей, миграции и сидер начальных данных.

## Основные файлы

- `AppDbContext.cs` — контекст Entity Framework Core
- `Models/` — сущности: `User`, `Event`, `Badge`
- `Migrations/` — миграции EF Core
- `SeedData.cs` — инициализация ролей и администратора
