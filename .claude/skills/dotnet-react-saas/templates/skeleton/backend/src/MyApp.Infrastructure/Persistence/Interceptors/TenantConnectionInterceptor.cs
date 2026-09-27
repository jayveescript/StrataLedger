using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using MyApp.Application.Common.Services;

namespace MyApp.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Pushes the tenant into Postgres session settings whenever a connection opens so Row-Level Security policies
/// enforce isolation even if an application query forgets a filter.
/// </summary>
public sealed class TenantConnectionInterceptor(ITenantContext tenant) : DbConnectionInterceptor
{
    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using var command = TenantSessionSql.CreateCommand(connection, tenant.TenantId, tenant.IsPlatformScope);
        command.ExecuteNonQuery();
    }

    public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await using var command = TenantSessionSql.CreateCommand(connection, tenant.TenantId, tenant.IsPlatformScope);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}

public static class TenantSessionSql
{
    public const string TenantSetting = "app.tenant_id";
    public const string BypassSetting = "app.bypass_rls";

    public static DbCommand CreateCommand(DbConnection connection, Guid? tenantId, bool bypass)
    {
        var command = connection.CreateCommand();
        command.CommandText = $"SELECT set_config('{TenantSetting}', @tenant, false), set_config('{BypassSetting}', @bypass, false)";
        command.Parameters.Add(new NpgsqlParameter("tenant", tenantId?.ToString() ?? string.Empty));
        command.Parameters.Add(new NpgsqlParameter("bypass", bypass ? "on" : "off"));
        return command;
    }
}
