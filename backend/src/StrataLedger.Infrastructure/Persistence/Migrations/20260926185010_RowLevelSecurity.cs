using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StrataLedger.Infrastructure.Persistence.Migrations
{
    /// <summary>
    /// Postgres Row-Level Security on tenant tables: a second, database-enforced isolation layer behind the EF query
    /// filters. The API sets app.company_id / app.bypass_rls on every connection (see TenantConnectionInterceptor).
    /// FORCE applies the policy to the table owner too, so the application role cannot bypass it by accident.
    /// </summary>
    public partial class RowLevelSecurity : Migration
    {
        private static readonly string[] TenantTables = ["strata_plans", "lots", "owners", "lot_ownerships"];

        private const string Predicate =
            "current_setting('app.bypass_rls', true) = 'on' " +
            "OR company_id = NULLIF(current_setting('app.company_id', true), '')::uuid";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var table in TenantTables)
            {
                migrationBuilder.Sql($"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"CREATE POLICY tenant_isolation ON {table} USING ({Predicate}) WITH CHECK ({Predicate});");
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in TenantTables)
            {
                migrationBuilder.Sql($"DROP POLICY IF EXISTS tenant_isolation ON {table};");
                migrationBuilder.Sql($"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY;");
                migrationBuilder.Sql($"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;");
            }
        }
    }
}
