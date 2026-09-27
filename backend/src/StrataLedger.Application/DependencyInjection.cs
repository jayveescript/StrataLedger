using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using StrataLedger.Application.Common.Behaviors;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Auth;
using StrataLedger.Application.Features.Companies;
using StrataLedger.Application.Features.Invitations;

namespace StrataLedger.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddScoped<IDispatcher, Dispatcher>();
        services.AddScoped<SignInFlow>();
        services.AddScoped<UsageLimits>();
        services.AddScoped<InvitationService>();
        services.AddScoped<InvitationRowValidator>();
        services.AddSingleton<IRuleProvider, StateRuleProvider>();
        services.AddValidatorsFromAssembly(assembly, ServiceLifetime.Scoped, includeInternalTypes: true);

        var handlerRegistrations = assembly.GetTypes()
            .Where(t => t is { IsAbstract: false, IsInterface: false })
            .SelectMany(t => t.GetInterfaces()
                .Where(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequestHandler<,>))
                .Select(i => (Service: i, Implementation: t)));

        foreach (var (service, implementation) in handlerRegistrations)
        {
            services.AddScoped(service, implementation);
        }

        // Order matters: outermost first.
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(AuthorizationBehavior<,>));
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddScoped(typeof(IPipelineBehavior<,>), typeof(TransactionBehavior<,>));

        return services;
    }
}
