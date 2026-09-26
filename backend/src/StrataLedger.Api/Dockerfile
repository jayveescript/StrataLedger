# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props .editorconfig ./
COPY src/StrataLedger.Domain/StrataLedger.Domain.csproj src/StrataLedger.Domain/
COPY src/StrataLedger.Application/StrataLedger.Application.csproj src/StrataLedger.Application/
COPY src/StrataLedger.Infrastructure/StrataLedger.Infrastructure.csproj src/StrataLedger.Infrastructure/
COPY src/StrataLedger.Api/StrataLedger.Api.csproj src/StrataLedger.Api/
RUN dotnet restore src/StrataLedger.Api/StrataLedger.Api.csproj
COPY src/ src/
RUN dotnet publish src/StrataLedger.Api/StrataLedger.Api.csproj -c Release -o /app --no-restore /p:UseAppHost=false

# Chiseled image: no shell, no package manager, runs as non-root.
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_gcServer=1
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "StrataLedger.Api.dll"]
