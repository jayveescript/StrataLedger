using System.Diagnostics;
using Microsoft.Extensions.Logging;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Results;

namespace MyApp.Application.Common.Behaviors;

public sealed partial class LoggingBehavior<TRequest, TResult>(ILogger<LoggingBehavior<TRequest, TResult>> logger)
    : IPipelineBehavior<TRequest, TResult> where TRequest : IRequest<TResult>
{
    private static readonly string RequestName = typeof(TRequest).Name;

    public async Task<Result<TResult>> Handle(TRequest request, RequestHandlerDelegate<TResult> next, CancellationToken cancellationToken)
    {
        var started = Stopwatch.GetTimestamp();
        var result = await next();
        var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;

        if (result.IsFailure)
        {
            LogFailure(logger, RequestName, result.Error!.Code, elapsed);
        }
        else
        {
            LogHandled(logger, RequestName, elapsed);
        }

        return result;
    }

    [LoggerMessage(Level = LogLevel.Debug, Message = "Handled {Request} in {ElapsedMs:0.0} ms")]
    private static partial void LogHandled(ILogger logger, string request, double elapsedMs);

    [LoggerMessage(Level = LogLevel.Information, Message = "{Request} failed with {ErrorCode} in {ElapsedMs:0.0} ms")]
    private static partial void LogFailure(ILogger logger, string request, string errorCode, double elapsedMs);
}
