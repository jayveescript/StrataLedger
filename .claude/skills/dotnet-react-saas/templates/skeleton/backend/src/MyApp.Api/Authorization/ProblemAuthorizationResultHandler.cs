using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;
using Microsoft.AspNetCore.Mvc;

namespace MyApp.Api.Authorization;

/// <summary>Returns ProblemDetails for 401/403, and 402 when the only thing missing is a paid feature.</summary>
public sealed class ProblemAuthorizationResultHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _default = new();

    public async Task HandleAsync(RequestDelegate next, HttpContext context, AuthorizationPolicy policy, PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Succeeded)
        {
            await _default.HandleAsync(next, context, policy, authorizeResult);
            return;
        }

        var missingFeature = authorizeResult.AuthorizationFailure?.FailedRequirements.OfType<FeatureRequirement>().FirstOrDefault();
        var (status, code, title) = (authorizeResult.Challenged, missingFeature) switch
        {
            (true, _) => (StatusCodes.Status401Unauthorized, "auth.unauthorized", "Authentication is required."),
            (_, { } f) => (StatusCodes.Status402PaymentRequired, "feature.disabled", $"The {f.Feature} feature is not included in your plan."),
            _ => (StatusCodes.Status403Forbidden, "auth.forbidden", "You do not have access to this resource."),
        };

        var problem = new ProblemDetails { Status = status, Title = title, Instance = context.Request.Path };
        problem.Extensions["code"] = code;
        if (missingFeature is not null)
        {
            problem.Extensions["feature"] = missingFeature.Feature.ToString();
        }

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, (System.Text.Json.JsonSerializerOptions?)null, "application/problem+json");
    }
}
