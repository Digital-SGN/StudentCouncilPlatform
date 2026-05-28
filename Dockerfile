FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY StudentCouncil.Data/*.csproj StudentCouncil.Data/
COPY StudentCouncil.Logic/*.csproj StudentCouncil.Logic/
COPY StudentCouncil.Web/*.csproj StudentCouncil.Web/

RUN dotnet restore "StudentCouncil.Web/StudentCouncil.Web.csproj"

COPY StudentCouncil.Data/ StudentCouncil.Data/
COPY StudentCouncil.Logic/ StudentCouncil.Logic/
COPY StudentCouncil.Web/ StudentCouncil.Web/

WORKDIR "/src/StudentCouncil.Web"
RUN dotnet publish "StudentCouncil.Web.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "StudentCouncil.Web.dll"]
