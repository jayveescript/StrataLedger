using MyApp.Application.Common.Results;

namespace MyApp.Application.Common.Messaging;

/// <summary>A request whose handler produces <see cref="Result{TResult}"/>.</summary>
public interface IRequest<TResult>;

/// <summary>State-changing request. Wrapped in a database transaction by default.</summary>
public interface ICommand<TResult> : IRequest<TResult>;

/// <summary>Read-only request.</summary>
public interface IQuery<TResult> : IRequest<TResult>;

public interface IRequestHandler<in TRequest, TResult> where TRequest : IRequest<TResult>
{
    Task<Result<TResult>> Handle(TRequest request, CancellationToken cancellationToken);
}

public delegate Task<Result<TResult>> RequestHandlerDelegate<TResult>();

public interface IPipelineBehavior<in TRequest, TResult> where TRequest : IRequest<TResult>
{
    Task<Result<TResult>> Handle(TRequest request, RequestHandlerDelegate<TResult> next, CancellationToken cancellationToken);
}

public interface IDispatcher
{
    Task<Result<TResult>> Send<TResult>(IRequest<TResult> request, CancellationToken cancellationToken = default);
}
