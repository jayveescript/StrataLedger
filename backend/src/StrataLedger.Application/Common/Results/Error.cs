namespace StrataLedger.Application.Common.Results;

public enum ErrorType
{
    Validation = 1,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    LimitReached,
    FeatureDisabled,
    TooManyRequests,
    Failure,
}

public sealed record Error(ErrorType Type, string Code, string Message, IReadOnlyDictionary<string, string[]>? Details = null)
{
    public static Error Validation(string code, string message, IReadOnlyDictionary<string, string[]>? details = null) =>
        new(ErrorType.Validation, code, message, details);

    public static Error Unauthorized(string message = "Authentication is required.") =>
        new(ErrorType.Unauthorized, "auth.unauthorized", message);

    public static Error Forbidden(string message = "You do not have access to this resource.") =>
        new(ErrorType.Forbidden, "auth.forbidden", message);

    public static Error NotFound(string entity) =>
        new(ErrorType.NotFound, $"{entity.ToLowerInvariant()}.not_found", $"{entity} was not found.");

    public static Error Conflict(string code, string message) => new(ErrorType.Conflict, code, message);

    public static Error LimitReached(string code, string message) => new(ErrorType.LimitReached, code, message);

    public static Error FeatureDisabled(string feature) =>
        new(ErrorType.FeatureDisabled, "feature.disabled", $"The {feature} feature is not included in your plan.");

    public static Error Failure(string code, string message) => new(ErrorType.Failure, code, message);
}
