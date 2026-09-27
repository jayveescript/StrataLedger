using StrataLedger.Application.Common.Results;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Rules;

namespace StrataLedger.Application.Common.Services;

/// <summary>Resolves the effective state → company → plan value of a rule.</summary>
public interface IRuleProvider
{
    Task<ResolvedRule> ResolveAsync(RuleKey key, AustralianState state, Guid companyId, Guid? strataPlanId = null,
        CancellationToken cancellationToken = default);
}

/// <summary>State rules only. Company and plan overrides arrive with the full rules engine.</summary>
public sealed class StateRuleProvider : IRuleProvider
{
    public Task<ResolvedRule> ResolveAsync(RuleKey key, AustralianState state, Guid companyId, Guid? strataPlanId = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(RuleResolver.Resolve(key, state));
}

public static class RuleErrors
{
    public static Error Undefined(ResolvedRule rule) => Error.Validation("rules.undefined",
        $"The {rule.Key.Label.ToLowerInvariant()} rule has not been configured for {rule.State} yet, " +
        "so this action cannot be checked against state legislation.");
}
