using System.Reflection;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;

namespace MyApp.Application.Common.Behaviors;

/// <summary>Commands run inside a transaction and are saved once; failures roll everything back.</summary>
public sealed class TransactionBehavior<TRequest, TResult>(IUnitOfWork unitOfWork)
    : IPipelineBehavior<TRequest, TResult> where TRequest : ICommand<TResult>
{
    private static readonly bool Skip = typeof(TRequest).IsDefined(typeof(NonTransactionalAttribute));

    public Task<Result<TResult>> Handle(TRequest request, RequestHandlerDelegate<TResult> next, CancellationToken cancellationToken) =>
        Skip
            ? next()
            : unitOfWork.ExecuteInTransactionAsync(async ct =>
            {
                var result = await next();
                if (result.IsSuccess)
                {
                    await unitOfWork.SaveChangesAsync(ct);
                }

                return result;
            }, cancellationToken);
}
