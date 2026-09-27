using System.Collections.Frozen;
using Microsoft.AspNetCore.Mvc;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Results;

namespace StrataLedger.Api.Infrastructure;

/// <summary>
/// Every endpoint is "build the request, send it, map the result". Error types map to HTTP status codes through a
/// lookup table, so controllers carry no branching of their own.
/// </summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    private static readonly FrozenDictionary<ErrorType, int> StatusCodesByError = new Dictionary<ErrorType, int>
    {
        [ErrorType.Validation] = StatusCodes.Status400BadRequest,
        [ErrorType.Unauthorized] = StatusCodes.Status401Unauthorized,
        [ErrorType.Forbidden] = StatusCodes.Status403Forbidden,
        [ErrorType.NotFound] = StatusCodes.Status404NotFound,
        [ErrorType.Conflict] = StatusCodes.Status409Conflict,
        [ErrorType.LimitReached] = StatusCodes.Status402PaymentRequired,
        [ErrorType.FeatureDisabled] = StatusCodes.Status402PaymentRequired,
        [ErrorType.TooManyRequests] = StatusCodes.Status429TooManyRequests,
        [ErrorType.Failure] = StatusCodes.Status500InternalServerError,
    }.ToFrozenDictionary();

    private IDispatcher Dispatcher => HttpContext.RequestServices.GetRequiredService<IDispatcher>();

    protected async Task<IActionResult> Send<T>(IRequest<T> request, Func<T, IActionResult>? onSuccess = null)
    {
        var result = await Dispatcher.Send(request, HttpContext.RequestAborted);
        return result.Match(value => onSuccess?.Invoke(value) ?? Ok(value), ToProblem);
    }

    protected Task<IActionResult> SendNoContent<T>(IRequest<T> request) => Send(request, _ => NoContent());

    protected Task<IActionResult> SendCreated(IRequest<Guid> request, string location) =>
        Send(request, id => Created($"{location.TrimEnd('/')}/{id}", new { id }));

    protected async Task<Result<T>> Dispatch<T>(IRequest<T> request) =>
        await Dispatcher.Send(request, HttpContext.RequestAborted);

    protected ObjectResult ToProblem(Error error)
    {
        var status = StatusCodesByError.GetValueOrDefault(error.Type, StatusCodes.Status500InternalServerError);
        var problem = new ProblemDetails
        {
            Status = status,
            Title = error.Message,
            Type = $"https://httpstatuses.io/{status}",
            Instance = HttpContext.Request.Path,
        };
        problem.Extensions["code"] = error.Code;
        problem.Extensions["traceId"] = HttpContext.TraceIdentifier;
        if (error.Details is not null)
        {
            problem.Extensions["errors"] = error.Details;
        }

        return new ObjectResult(problem) { StatusCode = status, ContentTypes = { "application/problem+json" } };
    }
}
