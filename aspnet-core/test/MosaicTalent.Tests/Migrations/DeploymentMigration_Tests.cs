using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using MosaicTalent.EntityFrameworkCore;
using MosaicTalent.Migrator;
using MosaicTalent.MultiTenancy;
using Shouldly;
using Xunit;

namespace MosaicTalent.Tests.Migrations;

public class DeploymentMigration_Tests
{
    [Fact]
    public void Current_model_has_a_migration_and_no_pending_model_changes()
    {
        var options = new DbContextOptionsBuilder<MosaicTalentDbContext>()
            .UseNpgsql("Host=localhost;Database=metadata_only;Username=unused;Password=unused")
            .Options;
        using var context = new MosaicTalentDbContext(options);
        context.Database.GetMigrations().ShouldContain("20261107141846_IdeatorAndPrivateProjectWorkspace");
        context.Database.HasPendingModelChanges().ShouldBeFalse();
    }

    [Fact]
    public void Shared_tenant_database_is_migrated_once()
    {
        var calls = 0;
        var tenants = new[] { new Tenant { ConnectionString = "same" }, new Tenant { ConnectionString = "same" } };
        TenantMigrationBatch.Run(tenants, _ => calls++, _ => { }).ShouldBeTrue();
        calls.ShouldBe(1);
    }

    [Fact]
    public void Failure_returns_false_continues_other_databases_and_redacts_exception_details()
    {
        var calls = new List<string>();
        var logs = new List<string>();
        var tenants = new[] { new Tenant { ConnectionString = "broken" }, new Tenant { ConnectionString = "healthy" } };
        var succeeded = TenantMigrationBatch.Run(tenants, tenant =>
        {
            calls.Add(tenant.ConnectionString);
            if (tenant.ConnectionString == "broken") throw new InvalidOperationException("Password=secret");
        }, logs.Add);
        succeeded.ShouldBeFalse();
        calls.ShouldBe(new[] { "broken", "healthy" });
        string.Join(" ", logs).ShouldNotContain("secret");
    }

    [Fact]
    public void Failed_database_is_not_marked_as_completed()
    {
        var calls = 0;
        var tenants = new[] { new Tenant { ConnectionString = "same" }, new Tenant { ConnectionString = "same" } };
        TenantMigrationBatch.Run(tenants, _ =>
        {
            if (++calls == 1) throw new InvalidOperationException();
        }, _ => { }).ShouldBeFalse();
        calls.ShouldBe(2);
    }
}
