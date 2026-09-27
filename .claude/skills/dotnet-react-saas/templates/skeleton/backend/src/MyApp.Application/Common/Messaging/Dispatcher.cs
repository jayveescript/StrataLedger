using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using MyApp.Application.Common.Results;

namespace MyApp.Application.Common.Messaging;

/// <summary>
/// Resolves the handler for a request plus every registered pipeline behavior and runs them as a chain.
/// The closed generic invoker is built once per request type and cached, so dispatch is allocation-light.
/// </summary>
public sealed class Dispatcher(IServiceProvider serviceProvider) : IDispatcher
{
    private static readonly ConcurrentDictionary<Type, object> Invokers = new();

    public Task<Result<TResult>> Send<TResult>(IRequest<TResult> request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var invoker = (RequestInvoker<TResult>)Invokers.GetOrAdd(
            request.GetType(),
            static type => Activator.CreateInstance(
                typeof(RequestInvoker<,>).MakeGenericType(type, typeof(TResult)))!);

        return invoker.Invoke(request, serviceProvider, cancellationToken);
    }

    private abstract class RequestInvoker<TResult>
    {
        public abstract Task<Result<TResult>> Invoke(IRequest<TResult> request, IServiceProvider services, CancellationToken ct);
    }

    private sealed class RequestInvoker<TRequest, TResult> : RequestInvoker<TResult>
        where TRequest : IRequest<TResult>
    {
        public override Task<Result<TResult>> Invoke(IRequest<TResult> request, IServiceProvider services, CancellationToken ct)
        {
            var typed = (TRequest)request;
            var handler = services.GetRequiredService<IRequestHandler<TRequest, TResult>>();
            var behaviors = services.GetServices<IPipelineBehavior<TRequest, TResult>>();

            RequestHandlerDelegate<TResult> pipeline = () => handler.Handle(typed, ct);
            foreach (var behavior in behaviors.Reverse())
            {
                var next = pipeline;
                pipeline = () => behavior.Handle(typed, next, ct);
            }

            return pipeline();
        }
    }
}
