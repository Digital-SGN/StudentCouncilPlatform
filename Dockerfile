FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Копируем всё решение (все проекты)
COPY . .

# Восстанавливаем зависимости для WebApi проекта
RUN dotnet restore "StudentCouncil.Web/StudentCouncil.WebApi.csproj"

# Публикуем WebApi проект
RUN dotnet publish "StudentCouncil.Web/StudentCouncil.WebApi.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "StudentCouncil.WebApi.dll"]