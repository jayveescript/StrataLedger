using Microsoft.AspNetCore.Identity;

namespace MyApp.Application.Common.Results;

public static class IdentityResultExtensions
{
    private const string InvalidToken = "InvalidToken";

    /// <summary>Maps Identity failures (password policy, breach, reuse) to a field-level validation error.</summary>
    public static Error ToError(this IdentityResult result, string field, Error? invalidTokenError = null)
    {
        if (invalidTokenError is not null && result.Errors.Any(e => e.Code == InvalidToken))
        {
            return invalidTokenError;
        }

        var messages = result.Errors.Select(e => e.Description).ToArray();
        return Error.Validation("identity.failed", messages.FirstOrDefault() ?? "The request could not be completed.",
            new Dictionary<string, string[]> { [field] = messages });
    }
}
