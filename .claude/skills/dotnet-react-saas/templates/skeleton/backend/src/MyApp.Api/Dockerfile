# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props .editorconfig ./
COPY src/MyApp.Domain/MyApp.Domain.csproj src/MyApp.Domain/
COPY src/MyApp.Application/MyApp.Application.csproj src/MyApp.Application/
COPY src/MyApp.Infrastructure/MyApp.Infrastructure.csproj src/MyApp.Infrastructure/
COPY src/MyApp.Api/MyApp.Api.csproj src/MyApp.Api/
RUN dotnet restore src/MyApp.Api/MyApp.Api.csproj
COPY src/ src/
RUN dotnet publish src/MyApp.Api/MyApp.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

# Chiseled image: no shell, no package manager, runs as non-root.
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_gcServer=1
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "MyApp.Api.dll"]
