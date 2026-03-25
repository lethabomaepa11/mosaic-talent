FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["src/MosaicTalent.Web.Host/MosaicTalent.Web.Host.csproj", "src/MosaicTalent.Web.Host/"]
COPY ["src/MosaicTalent.Web.Core/MosaicTalent.Web.Core.csproj", "src/MosaicTalent.Web.Core/"]
COPY ["src/MosaicTalent.Application/MosaicTalent.Application.csproj", "src/MosaicTalent.Application/"]
COPY ["src/MosaicTalent.Core/MosaicTalent.Core.csproj", "src/MosaicTalent.Core/"]
COPY ["src/MosaicTalent.EntityFrameworkCore/MosaicTalent.EntityFrameworkCore.csproj", "src/MosaicTalent.EntityFrameworkCore/"]
WORKDIR "/src/src/MosaicTalent.Web.Host"
RUN dotnet restore
WORKDIR /src
COPY ["src/MosaicTalent.Web.Host", "src/MosaicTalent.Web.Host"]
COPY ["src/MosaicTalent.Web.Core", "src/MosaicTalent.Web.Core"]
COPY ["src/MosaicTalent.Application", "src/MosaicTalent.Application"]
COPY ["src/MosaicTalent.Core", "src/MosaicTalent.Core"]
COPY ["src/MosaicTalent.EntityFrameworkCore", "src/MosaicTalent.EntityFrameworkCore"]
WORKDIR "/src/src/MosaicTalent.Web.Host"
RUN dotnet publish -c Release -o /publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "MosaicTalent.Web.Host.dll"]