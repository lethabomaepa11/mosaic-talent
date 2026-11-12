FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/MosaicTalent.Web.Host/MosaicTalent.Web.Host.csproj", "src/MosaicTalent.Web.Host/"]
COPY ["src/MosaicTalent.Web.Core/MosaicTalent.Web.Core.csproj", "src/MosaicTalent.Web.Core/"]
COPY ["src/MosaicTalent.Application/MosaicTalent.Application.csproj", "src/MosaicTalent.Application/"]
COPY ["src/MosaicTalent.Core/MosaicTalent.Core.csproj", "src/MosaicTalent.Core/"]
COPY ["src/MosaicTalent.EntityFrameworkCore/MosaicTalent.EntityFrameworkCore.csproj", "src/MosaicTalent.EntityFrameworkCore/"]
COPY ["src/MosaicTalent.Migrator/MosaicTalent.Migrator.csproj", "src/MosaicTalent.Migrator/"]
WORKDIR "/src/src/MosaicTalent.Web.Host"
RUN dotnet restore
RUN dotnet restore ../MosaicTalent.Migrator/MosaicTalent.Migrator.csproj
WORKDIR /src
COPY ["src/MosaicTalent.Web.Host", "src/MosaicTalent.Web.Host"]
COPY ["src/MosaicTalent.Web.Core", "src/MosaicTalent.Web.Core"]
COPY ["src/MosaicTalent.Application", "src/MosaicTalent.Application"]
COPY ["src/MosaicTalent.Core", "src/MosaicTalent.Core"]
COPY ["src/MosaicTalent.EntityFrameworkCore", "src/MosaicTalent.EntityFrameworkCore"]
COPY ["src/MosaicTalent.Migrator", "src/MosaicTalent.Migrator"]
WORKDIR "/src/src/MosaicTalent.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore
RUN dotnet publish ../MosaicTalent.Migrator/MosaicTalent.Migrator.csproj -c Release -o /migrator --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /publish .
COPY --from=build /migrator ./migrator
COPY --chmod=755 ["docker/run-migrations.sh", "/app/run-migrations.sh"]
COPY --chmod=755 ["docker/start-web.sh", "/app/start-web.sh"]
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["/app/start-web.sh"]
