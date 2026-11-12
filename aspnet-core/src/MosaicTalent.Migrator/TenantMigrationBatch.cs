using System;
using System.Collections.Generic;
using MosaicTalent.MultiTenancy;

namespace MosaicTalent.Migrator;

public static class TenantMigrationBatch
{
    public static bool Run(IEnumerable<Tenant> tenants, Action<Tenant> migrate, Action<string> log)
    {
        var completed = new HashSet<string>();
        var allSucceeded = true;
        foreach (var tenant in tenants)
        {
            if (completed.Contains(tenant.ConnectionString))
            {
                log("Tenant database already migrated. Skipping duplicate connection.");
                continue;
            }
            try
            {
                migrate(tenant);
                completed.Add(tenant.ConnectionString);
            }
            catch (Exception error)
            {
                // Exceptions can contain credentials; deployment logs need only the failure type.
                log("Tenant migration failed (" + error.GetType().Name + "). Continuing with other databases.");
                allSucceeded = false;
            }
        }
        return allSucceeded;
    }
}
