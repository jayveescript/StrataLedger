using FluentValidation;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Results;

namespace MyApp.Application.Common.Behaviors;

public sealed class ValidationBehavior<TRequest, TResult>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResult> where TRequest : IRequest<TResult>
{
    private readonly IValidator<TRequest>[] _validators = validators.ToArray();

    public async Task<Result<TResult>> Handle(TRequest request, RequestHandlerDelegate<TResult> next, CancellationToken cancellationToken)
    {
        if (_validators.Length == 0)
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);
        var results = await Task.WhenAll(_validators.Select(v => v.ValidateAsync(context, cancellationToken)));
        var errors = results
            .SelectMany(r => r.Errors)
            .GroupBy(e => e.PropertyName, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).Distinct().ToArray(), StringComparer.Ordinal);

        return errors.Count == 0
            ? await next()
            : Error.Validation("validation.failed", "One or more fields are invalid.", errors);
    }
}
