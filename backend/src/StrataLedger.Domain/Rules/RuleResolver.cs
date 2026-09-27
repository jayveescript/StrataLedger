using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Rules;

public enum RuleSource
{
    State = 1,
    Company,
    Plan,
}

/// <summary>The effective value of a rule for one plan, with each layer's input kept for explanation.</summary>
public sealed record ResolvedRule(
    RuleKey Key,
    AustralianState State,
    bool IsDefined,
    decimal? Value,
    RuleSource Source,
    decimal? StateValue,
    decimal? CompanyValue,
    decimal? PlanValue,
    RuleSource? ViolatingLayer)
{
    public bool IsViolation => ViolatingLayer is not null;

    public bool AsBool() => Value is { } v && v != 0;
}

/// <summary>
/// Resolves state (L1) → company (L2) → plan (L3). The last valid layer wins; a layer that breaches the state
/// floor/ceiling is recorded as a violation and ignored, so state law always holds. Fixed rules ignore overrides,
/// and layers a rule does not allow to override it are ignored.
/// </summary>
public static class RuleResolver
{
    public static ResolvedRule Resolve(RuleKey key, AustralianState state, decimal? companyValue = null,
        decimal? planValue = null)
    {
        companyValue = key.CompanyOverridable ? companyValue : null;
        planValue = key.PlanOverridable ? planValue : null;

        if (!StateRules.TryGet(state, key, out var stateValue))
        {
            return new ResolvedRule(key, state, IsDefined: false, null, RuleSource.State, null, companyValue,
                planValue, null);
        }

        var value = stateValue;
        var source = RuleSource.State;
        RuleSource? violatingLayer = null;

        if (key.Constraint != RuleConstraint.Fixed)
        {
            Apply(companyValue, RuleSource.Company);
            Apply(planValue, RuleSource.Plan);
        }

        return new ResolvedRule(key, state, IsDefined: true, value, source, stateValue, companyValue, planValue,
            violatingLayer);

        void Apply(decimal? candidate, RuleSource layer)
        {
            if (candidate is null)
            {
                return;
            }

            if (Violates(key.Constraint, stateValue, candidate.Value))
            {
                violatingLayer ??= layer;
                return;
            }

            value = candidate;
            source = layer;
        }
    }

    private static bool Violates(RuleConstraint constraint, decimal? stateValue, decimal candidate) =>
        stateValue is { } limit && constraint switch
        {
            RuleConstraint.Minimum => candidate < limit,
            RuleConstraint.Maximum => candidate > limit,
            _ => false,
        };
}
