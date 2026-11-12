using Abp.Data;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Extensions;
using Abp.MultiTenancy;
using Abp.Runtime.Security;
using MosaicTalent.EntityFrameworkCore;
using MosaicTalent.EntityFrameworkCore.Seed;
using MosaicTalent.MultiTenancy;
using System;
using System.Data.Common;

namespace MosaicTalent.Migrator;

public class MultiTenantMigrateExecuter : ITransientDependency
{
    private readonly Log _log;
    private readonly AbpZeroDbMigrator _migrator;
    private readonly IRepository<Tenant> _tenantRepository;
    private readonly IDbPerTenantConnectionStringResolver _connectionStringResolver;

    public MultiTenantMigrateExecuter(
        AbpZeroDbMigrator migrator,
        IRepository<Tenant> tenantRepository,
        Log log,
        IDbPerTenantConnectionStringResolver connectionStringResolver)
    {
        _log = log;

        _migrator = migrator;
        _tenantRepository = tenantRepository;
        _connectionStringResolver = connectionStringResolver;
    }

    public bool Run(bool skipConnVerification)
    {
        var hostConnStr = CensorConnectionString(_connectionStringResolver.GetNameOrConnectionString(new ConnectionStringResolveArgs(MultiTenancySides.Host)));
        if (hostConnStr.IsNullOrWhiteSpace())
        {
            _log.Write("Configuration file should contain a connection string named 'Default'");
            return false;
        }

        _log.Write("Host database: " + ConnectionStringHelper.GetConnectionString(hostConnStr));
        if (!skipConnVerification)
        {
            _log.Write("Continue to migration for this host database and all tenants..? (Y/N): ");
            var command = Console.ReadLine();
            if (!command.IsIn("Y", "y"))
            {
                _log.Write("Migration canceled.");
                return false;
            }
        }

        _log.Write("HOST database migration started...");

        try
        {
            _migrator.CreateOrMigrateForHost(SeedHelper.SeedHostDb);
        }
        catch (Exception ex)
        {
            _log.Write("An error occured during migration of host database:");
            _log.Write(ex.ToString());
            _log.Write("Canceled migrations.");
            return false;
        }

        _log.Write("HOST database migration completed.");
        _log.Write("--------------------------------------------------------");

        var tenants = _tenantRepository.GetAllList(t => t.ConnectionString != null && t.ConnectionString != "");
        var allSucceeded = TenantMigrationBatch.Run(tenants, tenant =>
        {
            _log.Write("Tenant database migration started: " + tenant.TenancyName);
            _log.Write("Connection string : " + CensorConnectionString(SimpleStringCipher.Instance.Decrypt(tenant.ConnectionString)));
            _migrator.CreateOrMigrateForTenant(tenant);
            _log.Write("Tenant database migration completed: " + tenant.TenancyName);
        }, message => _log.Write(message));

        _log.Write(allSucceeded ? "All databases have been migrated." : "One or more tenant databases failed to migrate.");
        return allSucceeded;
    }

    private static string CensorConnectionString(string connectionString)
    {
        var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };
        var keysToMask = new[] { "password", "pwd", "user id", "uid" };

        foreach (var key in keysToMask)
        {
            if (builder.ContainsKey(key))
            {
                builder[key] = "*****";
            }
        }

        return builder.ToString();
    }
}
