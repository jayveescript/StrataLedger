using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NSubstitute;
using MyApp.Application;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.UnitTests.Application;

[RequiresPermission(Permission.ItemsWrite), RequiresFeature(Feature.Reports)]
public sealed record ProtectedCommand(string Name) : ICommand<string>;

public sealed class ProtectedCommandValidator : AbstractValidator<ProtectedCommand>
{
    public ProtectedCommandValidator() => RuleFor(x => x.Name).NotEmpty();
}

public sealed class ProtectedCommandHandler : IRequestHandler<ProtectedCommand, string>
{
    public Task<Result<string>> Handle(ProtectedCommand request, CancellationToken cancellationToken) =>
        Task.FromResult(Result<string>.Success($"hello {request.Name}"));
}

[AllowAnonymousRequest]
public sealed record PublicQuery : IQuery<int>;

public sealed class PublicQueryHandler : IRequestHandler<PublicQuery, int>
{
    public Task<Result<int>> Handle(PublicQuery request, CancellationToken cancellationToken) => Task.FromResult(Result<int>.Success(42));
}

/// <summary>Exercises the real dispatcher + behaviors wired exactly as in production.</summary>
public sealed class PipelineTests
{
    private readonly ICurrentUser _user = Substitute.For<ICurrentUser>();
    private readonly IFeatureService _features = Substitute.For<IFeatureService>();
    private readonly IUnitOfWork _uow = Substitute.For<IUnitOfWork>();

    private IDispatcher Build()
    {
        _uow.ExecuteInTransactionAsync(Arg.Any<Func<CancellationToken, Task<Result<string>>>>(), Arg.Any<CancellationToken>())
            .Returns(ci => ci.Arg<Func<CancellationToken, Task<Result<string>>>>()(CancellationToken.None));

        var services = new ServiceCollection()
            .AddLogging(b => b.SetMinimumLevel(LogLevel.Warning))
            .AddSingleton(TimeProvider.System)
            .AddApplication()
            .AddScoped(_ => _user)
            .AddScoped(_ => _features)
            .AddScoped(_ => _uow)
            .AddScoped<IRequestHandler<ProtectedCommand, string>, ProtectedCommandHandler>()
            .AddScoped<IRequestHandler<PublicQuery, int>, PublicQueryHandler>()
            .AddScoped<IValidator<ProtectedCommand>, ProtectedCommandValidator>();
        return services.BuildServiceProvider().CreateScope().ServiceProvider.GetRequiredService<IDispatcher>();
    }

    private void SignIn(UserRole role, params Feature[] enabled)
    {
        var tenant = Guid.NewGuid();
        _user.IsAuthenticated.Returns(true);
        _user.Role.Returns(role);
        _user.TenantId.Returns(tenant);
        _user.HasPermission(Arg.Any<Permission>()).Returns(ci => MyApp.Domain.Authorization.RolePermissions.Has(role, ci.Arg<Permission>()));
        _features.GetEnabledFeaturesAsync(tenant, Arg.Any<CancellationToken>()).Returns(new HashSet<Feature>(enabled));
    }

    [Fact]
    public async Task Anonymous_callers_are_rejected_before_validation()
    {
        var result = await Build().Send(new ProtectedCommand(""));
        Assert.Equal(ErrorType.Unauthorized, result.Error!.Type);
    }

    [Fact]
    public async Task Missing_permission_is_forbidden()
    {
        SignIn(UserRole.Viewer, Feature.Reports);
        var result = await Build().Send(new ProtectedCommand("x"));
        Assert.Equal(ErrorType.Forbidden, result.Error!.Type);
    }

    [Fact]
    public async Task Missing_plan_feature_returns_feature_disabled()
    {
        SignIn(UserRole.Manager);
        var result = await Build().Send(new ProtectedCommand("x"));
        Assert.Equal(ErrorType.FeatureDisabled, result.Error!.Type);
    }

    [Fact]
    public async Task Invalid_input_returns_field_errors()
    {
        SignIn(UserRole.Manager, Feature.Reports);
        var result = await Build().Send(new ProtectedCommand(""));
        Assert.Equal(ErrorType.Validation, result.Error!.Type);
        Assert.Contains("Name", result.Error.Details!.Keys);
    }

    [Fact]
    public async Task Authorized_valid_command_runs_in_a_transaction_and_saves()
    {
        SignIn(UserRole.Manager, Feature.Reports);
        var result = await Build().Send(new ProtectedCommand("world"));
        Assert.Equal("hello world", result.Value);
        await _uow.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Anonymous_requests_are_allowed_when_marked()
    {
        var result = await Build().Send(new PublicQuery());
        Assert.Equal(42, result.Value);
    }
}
