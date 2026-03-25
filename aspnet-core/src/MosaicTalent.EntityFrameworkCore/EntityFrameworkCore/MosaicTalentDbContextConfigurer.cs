using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

namespace MosaicTalent.EntityFrameworkCore;

public static class MosaicTalentDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<MosaicTalentDbContext> builder, string connectionString)
    {
        builder.UseNpgsql(connectionString);
        builder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }

    public static void Configure(DbContextOptionsBuilder<MosaicTalentDbContext> builder, DbConnection connection)
    {
        builder.UseNpgsql(connection);
        builder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }
}
