# Fresh PostgreSQL Bootstrap

Issue [#117](https://github.com/lethabomaepa11/mosaic-talent/issues/117) fixes a release blocker for new Mosaic Talent environments.

The `Add-Projects` migration was present in source control but EF Core did not discover it because the migration class lacked its context and migration attributes. A later migration then tried to modify `Projects`, which did not exist on an empty database. The migration now has the same discovery metadata as the generated migrations.

The migrator also enables the PostgreSQL legacy timestamp setting used by the web host before it seeds ABP entities. This keeps the startup seeding path compatible with the existing entity timestamps.

Validation used a disposable PostgreSQL 16 database from empty state. The migrator completed all 22 discovered migrations and created the default edition and two seed users. Run the migrator before starting a new environment:

```powershell
$env:DOTNET_ROLL_FORWARD='Major'
dotnet run --project aspnet-core/src/MosaicTalent.Migrator/MosaicTalent.Migrator.csproj -- -q
```

Set `ConnectionStrings__Default` to the target PostgreSQL database before running it. The local setup uses ignored environment files; production credentials must remain outside source control.
