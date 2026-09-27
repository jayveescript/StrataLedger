using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace StrataLedger.Api.Infrastructure;

/// <summary>Maps unexpected exceptions to ProblemDetails without leaking internals.</summary>
public sealed partial class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    private static readonly Dictionary<Type, (int Status, string Code, string Title)> Known = new()
    {
        [typeof(InvalidDataException)] = (400, "request.invalid_file", "The uploaded file could not be read."),
        [typeof(BadHttpRequestException)] = (400, "request.invalid", "The request is invalid."),
        [typeof(DbUpdateConcurrencyException)] = (409, "concurrency", "The record was changed by someone else. Reload and try again."),
        [typeof(OperationCanceledException)] = (499, "request.cancelled", "The request was cancelled."),
    };

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, code, title) = Classify(exception);
        if (status >= 500)
        {
            LogUnhandled(logger, httpContext.TraceIdentifier, exception);
        }

        var problem = new ProblemDetails { Status = status, Title = title, Instance = httpContext.Request.Path };
        problem.Extensions["code"] = code;
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        if (exception is InvalidDataException)
        {
            problem.Detail = exception.Message;
        }

        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, (System.Text.Json.JsonSerializerOptions?)null, "application/problem+json", cancellationToken);
        return true;
    }

    private static (int Status, string Code, string Title) Classify(Exception exception) => exception switch
    {
        DbUpdateException { InnerException: PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } } =>
            (409, "conflict.duplicate", "A record with the same unique value already exists."),
        _ => Known.GetValueOrDefault(exception.GetType(), (500, "server.error", "An unexpected error occurred.")),
    };

    [LoggerMessage(Level = LogLevel.Error, Message = "Unhandled exception for trace {TraceId}")]
    private static partial void LogUnhandled(ILogger logger, string traceId, Exception exception);
}
