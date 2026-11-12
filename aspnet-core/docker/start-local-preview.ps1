param()
$ErrorActionPreference = 'Stop'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$dbName = 'mosaic-talent-mvp1-local-db'
$dbInfo = (docker inspect $dbName | ConvertFrom-Json)[0]
if ($LASTEXITCODE -ne 0 -or -not $dbInfo) { throw "The isolated local PostgreSQL container $dbName is required." }
$dbPort = $dbInfo.HostConfig.PortBindings.'5432/tcp'[0]
if ($dbPort.HostIp -ne '127.0.0.1' -or $dbPort.HostPort -ne '55432') {
    throw 'Expected the isolated PostgreSQL container on 127.0.0.1:55432.'
}
$dbValues = @{}
foreach ($entry in $dbInfo.Config.Env) {
    if ($entry -match '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=(.*)$') {
        $dbValues[$matches[1]] = $matches[2]
    }
}
if (-not $dbValues.POSTGRES_PASSWORD) { throw 'Local PostgreSQL credentials are missing.' }
docker start $dbName | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not start local PostgreSQL.' }
$env:ConnectionStrings__Default = "Host=127.0.0.1;Port=55432;Database=$($dbValues.POSTGRES_DB);Username=$($dbValues.POSTGRES_USER);Password=$($dbValues.POSTGRES_PASSWORD)"
$env:DOTNET_ROLL_FORWARD = 'Major'
$env:Authentication__JwtBearer__SecurityKey = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:PORT = '44311'
$env:App__ServerRootAddress = 'http://localhost:44311/'
$env:App__ClientRootAddress = 'http://localhost:3000/'
$env:App__CorsOrigins = 'http://localhost:3000,http://127.0.0.1:3000'
$hostProject = Join-Path $repoRoot 'aspnet-core/src/MosaicTalent.Web.Host/MosaicTalent.Web.Host.csproj'
dotnet build $hostProject --verbosity quiet /p:WarningLevel=0
if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
$hostDirectory = Join-Path $repoRoot 'aspnet-core/src/MosaicTalent.Web.Host/bin/Debug/net9.0'
if (Test-Path (Join-Path $hostDirectory '.env')) { throw 'Remove the .env from the build-output directory before isolated local startup.' }
Push-Location $hostDirectory
try {
    Write-Host 'Local API: http://localhost:44311/swagger'
    dotnet MosaicTalent.Web.Host.dll
} finally { Pop-Location }
