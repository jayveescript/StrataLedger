using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Rules;

namespace StrataLedger.UnitTests.Domain;

public sealed class RuleResolverTests
{
    [Fact]
    public void State_value_applies_when_there_are_no_overrides()
    {
        var rule = RuleResolver.Resolve(RuleKeys.ComplianceLevyNoticeDays, AustralianState.VIC);

        Assert.True(rule.IsDefined);
        Assert.Equal(28, rule.Value);
        Assert.Equal(RuleSource.State, rule.Source);
        Assert.False(rule.IsViolation);
    }

    [Fact]
    public void A_stricter_plan_value_overrides_the_company_value()
    {
        var rule = RuleResolver.Resolve(RuleKeys.AgmNoticeDaysMin, AustralianState.NSW, companyValue: 10, planValue: 14);

        Assert.Equal(14, rule.Value);
        Assert.Equal(RuleSource.Plan, rule.Source);
    }

    [Fact]
    public void A_value_below_a_state_minimum_is_a_violation_and_ignored()
    {
        var rule = RuleResolver.Resolve(RuleKeys.AgmNoticeDaysMin, AustralianState.QLD, companyValue: 14);

        Assert.Equal(21, rule.Value);
        Assert.Equal(RuleSource.State, rule.Source);
        Assert.Equal(RuleSource.Company, rule.ViolatingLayer);
    }

    [Fact]
    public void A_value_above_a_state_maximum_is_a_violation_but_a_later_valid_layer_still_wins()
    {
        var rule = RuleResolver.Resolve(RuleKeys.MaintenanceQuoteThreshold, AustralianState.VIC,
            companyValue: 2_500, planValue: 1_500);

        Assert.Equal(1_500, rule.Value);
        Assert.Equal(RuleSource.Plan, rule.Source);
        Assert.Equal(RuleSource.Company, rule.ViolatingLayer);
    }

    [Fact]
    public void Fixed_rules_ignore_overrides()
    {
        var rule = RuleResolver.Resolve(RuleKeys.VotingSpecialThreshold, AustralianState.NSW, 0.9m, 0.9m);

        Assert.Equal(0.75m, rule.Value);
        Assert.Equal(RuleSource.State, rule.Source);
    }

    [Fact]
    public void Layers_a_rule_does_not_allow_are_ignored()
    {
        var rule = RuleResolver.Resolve(RuleKeys.ArrearsInterestRateMaxPercent, AustralianState.NSW, companyValue: 5);

        Assert.Equal(10, rule.Value);
        Assert.Null(rule.CompanyValue);
    }

    [Fact]
    public void A_plan_can_opt_out_of_electronic_voting()
    {
        var rule = RuleResolver.Resolve(RuleKeys.AgmElectronicVotingAllowed, AustralianState.NSW, planValue: 0);

        Assert.False(rule.AsBool());
        Assert.Equal(RuleSource.Plan, rule.Source);
    }

    [Theory]
    [InlineData(AustralianState.WA)]
    [InlineData(AustralianState.SA)]
    [InlineData(AustralianState.TAS)]
    [InlineData(AustralianState.ACT)]
    [InlineData(AustralianState.NT)]
    public void States_without_signed_off_values_are_undefined(AustralianState state)
    {
        var rule = RuleResolver.Resolve(RuleKeys.ComplianceLevyNoticeDays, state);

        Assert.False(rule.IsDefined);
        Assert.Null(rule.Value);
    }

    [Fact]
    public void Every_defined_state_has_a_value_for_every_rule()
    {
        foreach (var state in new[] { AustralianState.NSW, AustralianState.VIC, AustralianState.QLD })
        {
            foreach (var key in RuleKeys.All)
            {
                Assert.True(StateRules.TryGet(state, key, out _), $"{state} is missing {key.Path}");
            }
        }
    }
}
