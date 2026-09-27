using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using StrataLedger.Application.Common.Services;

namespace StrataLedger.Infrastructure.Persistence.Interceptors;

/// <summary>
/// Pushes the tenant into Postgres session settings whenever a connection opens so Row-Level Security policies
/// enforce isolation even if an application query forgets a filter.
/// </summary>
public sealed class TenantConnectionInterceptor(ITenantContext tenant) : DbConnectionInterceptor
{
    public override void ConnectionOpened(DbConnection connection, ConnectionEndEventData eventData)
    {
        using var command = TenantSessionSql.CreateCommand(connection, tenant.CompanyId, tenant.IsPlatformScope);
        command.ExecuteNonQuery();
    }

    public override async Task ConnectionOpenedAsync(DbConnection connection, ConnectionEndEventData eventData,
        CancellationToken cancellationToken = default)
    {
        await using var command = TenantSessionSql.CreateCommand(connection, tenant.CompanyId, tenant.IsPlatformScope);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }
}

public static class TenantSessionSql
{
    public const string CompanySetting = "app.company_id";
    public const string BypassSetting = "app.bypass_rls";

    public static DbCommand CreateCommand(DbConnection connection, Guid? companyId, bool bypass)
    {
        var command = connection.CreateCommand();
        command.CommandText = $"SELECT set_config('{CompanySetting}', @company, false), set_config('{BypassSetting}', @bypass, false)";
        command.Parameters.Add(new NpgsqlParameter("company", companyId?.ToString() ?? string.Empty));
        command.Parameters.Add(new NpgsqlParameter("bypass", bypass ? "on" : "off"));
        return command;
    }
}
