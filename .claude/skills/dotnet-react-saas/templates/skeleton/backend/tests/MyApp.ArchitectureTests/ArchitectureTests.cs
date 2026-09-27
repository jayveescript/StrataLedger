using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using NetArchTest.Rules;
using MyApp.Api.Infrastructure;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Security;
using MyApp.Domain.Common;
using MyApp.Infrastructure.Persistence;

namespace MyApp.ArchitectureTests;

/// <summary>
/// Fails the build when the architecture drifts: layer dependencies, thin controllers, handler conventions,
/// default-deny request authorization, entity encapsulation, and RLS coverage of tenant tables.
/// </summary>
public sealed class ArchitectureTests
{
    private static readonly Assembly Domain = typeof(Entity).Assembly;
    private static readonly Assembly Application = typeof(IDispatcher).Assembly;
    private static readonly Assembly Infrastructure = typeof(AppDbContext).Assembly;
    private static readonly Assembly Api = typeof(ApiControllerBase).Assembly;

    private const string DomainNs = "MyApp.Domain";
    private const string ApplicationNs = "MyApp.Application";
    private const string InfrastructureNs = "MyApp.Infrastructure";
    private const string ApiNs = "MyApp.Api";

    private static void AssertSuccess(TestResult result, string rule) =>
        Assert.True(result.IsSuccessful, $"{rule}. Offending types: {string.Join(", ", result.FailingTypeNames ?? [])}");

    // ---- Layering -------------------------------------------------------------------------------------------------

    [Fact]
    public void Domain_depends_on_no_other_layer_or_framework()
    {
        var result = Types.InAssembly(Domain).ShouldNot()
            .HaveDependencyOnAny(ApplicationNs, InfrastructureNs, ApiNs, "Microsoft.EntityFrameworkCore", "Microsoft.AspNetCore.Mvc", "Npgsql")
            .GetResult();
        AssertSuccess(result, "Domain must stay persistence- and web-agnostic");
    }

    [Fact]
    public void Application_does_not_depend_on_infrastructure_or_api()
    {
        var result = Types.InAssembly(Application).ShouldNot()
            .HaveDependencyOnAny(InfrastructureNs, ApiNs, "Npgsql", "Microsoft.AspNetCore.Mvc", "StackExchange.Redis")
            .GetResult();
        AssertSuccess(result, "Application talks to infrastructure only through its own interfaces");
    }

    [Fact]
    public void Infrastructure_does_not_depend_on_api()
    {
        var result = Types.InAssembly(Infrastructure).ShouldNot().HaveDependencyOn(ApiNs).GetResult();
        AssertSuccess(result, "Infrastructure must not reference the API layer");
    }

    // ---- Controllers ----------------------------------------------------------------------------------------------

    [Fact]
    public void Controllers_are_sealed_thin_and_derive_from_the_base()
    {
        var controllers = Types.InAssembly(Api).That().Inherit(typeof(ControllerBase)).And().AreNotAbstract();

        AssertSuccess(controllers.Should().BeSealed().GetResult(), "Controllers must be sealed");
        AssertSuccess(controllers.Should().HaveNameEndingWith("Controller").GetResult(), "Controllers must end with 'Controller'");
        AssertSuccess(controllers.Should().Inherit(typeof(ApiControllerBase)).GetResult(), "Controllers must derive from ApiControllerBase");
        AssertSuccess(
            controllers.ShouldNot().HaveDependencyOnAny($"{InfrastructureNs}.Persistence", "Microsoft.EntityFrameworkCore",
                "MyApp.Application.Common.Persistence").GetResult(),
            "Controllers dispatch requests; they never touch the database or repositories");
    }

    // ---- CQRS conventions -----------------------------------------------------------------------------------------

    private static IEnumerable<Type> RequestTypes() =>
        Application.GetTypes().Where(t => t is { IsAbstract: false, IsInterface: false } &&
            t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequest<>)));

    private static IEnumerable<Type> HandlerTypes() =>
        Application.GetTypes().Where(t => t is { IsAbstract: false, IsInterface: false } &&
            t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>)));

    [Fact]
    public void Handlers_are_sealed_and_named_after_their_role()
    {
        var offenders = HandlerTypes().Where(t => !t.IsSealed || !t.Name.EndsWith("Handler", StringComparison.Ordinal)).Select(t => t.Name);
        Assert.Empty(offenders);
    }

    [Fact]
    public void Every_request_has_exactly_one_handler()
    {
        var handled = HandlerTypes()
            .SelectMany(h => h.GetInterfaces())
            .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>))
            .Select(i => i.GetGenericArguments()[0])
            .GroupBy(t => t)
            .ToDictionary(g => g.Key, g => g.Count());

        var missingOrDuplicate = RequestTypes().Where(r => handled.GetValueOrDefault(r) != 1).Select(r => r.Name);
        Assert.Empty(missingOrDuplicate);
    }

    [Fact]
    public void Requests_are_immutable_records_named_command_or_query()
    {
        var offenders = RequestTypes()
            .Where(t => t.GetMethod("<Clone>$") is null
                || !(t.Name.EndsWith("Command", StringComparison.Ordinal) || t.Name.EndsWith("Query", StringComparison.Ordinal)))
            .Select(t => t.Name);
        Assert.Empty(offenders);
    }

    /// <summary>
    /// Default deny: a request is either explicitly anonymous, explicitly permissioned, or a "current user only"
    /// request from the Account feature. Anything else probably forgot its [RequiresPermission].
    /// </summary>
    [Fact]
    public void Every_request_declares_how_it_is_authorized()
    {
        Assert.True(RequestTypes().Count() > 20, "Request discovery found too few types; the rule would pass vacuously");
        var offenders = RequestTypes()
            .Where(t => !t.IsDefined(typeof(AllowAnonymousRequestAttribute))
                && !t.IsDefined(typeof(RequiresPermissionAttribute))
                && t.Namespace != $"{ApplicationNs}.Features.Account")
            .Select(t => t.Name);
        Assert.Empty(offenders);
    }

    // ---- Domain encapsulation -------------------------------------------------------------------------------------

    [Fact]
    public void Domain_entities_do_not_expose_public_setters()
    {
        var baseTypes = new[] { typeof(Entity), typeof(AuditableEntity), typeof(TenantEntity) };
        var offenders = Domain.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && typeof(Entity).IsAssignableFrom(t))
            .SelectMany(t => t.GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => !baseTypes.Contains(p.DeclaringType) && p.SetMethod is { IsPublic: true })
                .Select(p => $"{t.Name}.{p.Name}"));
        Assert.Empty(offenders);
    }

    // ---- Tenancy --------------------------------------------------------------------------------------------------

    /// <summary>Tables that are tenant-owned but deliberately not RLS-protected (looked up before a tenant is known).</summary>
    private static readonly HashSet<string> RlsExempt = new(StringComparer.Ordinal)
    {
        "invitations",        // accepted anonymously by token hash, then scoped in code
        "invitation_batches", // written alongside invitations by platform/tenant admins
    };

    [Fact]
    public void Every_tenant_owned_table_has_row_level_security()
    {
        using var db = new DesignTimeDbContextFactory().CreateDbContext([]);
        var tenantTables = db.Model.GetEntityTypes()
            .Where(e => typeof(ITenantOwned).IsAssignableFrom(e.ClrType))
            .Select(e => e.GetTableName()!)
            .ToHashSet(StringComparer.Ordinal);

        var protectedTables = Infrastructure.GetTypes()
            .Where(t => typeof(Migration).IsAssignableFrom(t))
            .Select(t => t.GetField("TenantTables", BindingFlags.NonPublic | BindingFlags.Static)?.GetValue(null) as string[])
            .Where(tables => tables is not null)
            .SelectMany(tables => tables!)
            .ToHashSet(StringComparer.Ordinal);

        Assert.NotEmpty(tenantTables);
        Assert.NotEmpty(protectedTables);
        var unprotected = tenantTables.Except(protectedTables).Except(RlsExempt);
        Assert.Empty(unprotected);
    }
}
