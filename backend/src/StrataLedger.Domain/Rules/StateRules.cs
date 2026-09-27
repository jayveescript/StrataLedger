using System.Collections.Frozen;
using StrataLedger.Domain.Enums;
using static StrataLedger.Domain.Rules.RuleKeys;

namespace StrataLedger.Domain.Rules;

/// <summary>
/// Level 1 (state legislation) rule values. Only NSW, VIC and QLD are defined; other states are deliberately absent
/// until their values have legal sign-off, and callers must treat them as undefined rather than guess.
/// </summary>
/// <remarks>
/// Sources: NSW Strata Schemes Management Act 2015 (as amended 2023); VIC Owners Corporations Act 2006 and amendments;
/// QLD Body Corporate and Community Management Act 1997 and BCCM Regulation 2008.
/// </remarks>
public static class StateRules
{
    private static readonly FrozenDictionary<AustralianState, FrozenDictionary<RuleKey, decimal?>> Values =
        new Dictionary<AustralianState, FrozenDictionary<RuleKey, decimal?>>
        {
            [AustralianState.NSW] = Build(
                noticeDays: 7, quorum: 0.25m, quorumFallback: null, electronicVoting: true,
                adminFundMonths: 3, retentionYears: 7, minutesDeadline: 14, levyNoticeDays: 14,
                interestMax: 10, legalActionDays: 21, quoteThreshold: 3_000, urgentWorkMax: 10_000),
            [AustralianState.VIC] = Build(
                noticeDays: 14, quorum: 0.50m, quorumFallback: 30, electronicVoting: true,
                adminFundMonths: 2, retentionYears: 10, minutesDeadline: 30, levyNoticeDays: 28,
                interestMax: 10, legalActionDays: 60, quoteThreshold: 2_000, urgentWorkMax: 5_000),
            [AustralianState.QLD] = Build(
                noticeDays: 21, quorum: 0.25m, quorumFallback: 30, electronicVoting: true,
                adminFundMonths: 3, retentionYears: 7, minutesDeadline: 21, levyNoticeDays: 30,
                interestMax: 12, legalActionDays: 90, quoteThreshold: 6_500, urgentWorkMax: 3_250),
        }.ToFrozenDictionary();

    public static bool IsDefined(AustralianState state) => Values.ContainsKey(state);

    /// <summary>False when the state has no rule set. A defined rule may still have a null value (not applicable).</summary>
    public static bool TryGet(AustralianState state, RuleKey key, out decimal? value)
    {
        value = null;
        return Values.TryGetValue(state, out var rules) && rules.TryGetValue(key, out value);
    }

    private static FrozenDictionary<RuleKey, decimal?> Build(int noticeDays, decimal quorum, int? quorumFallback,
        bool electronicVoting, int adminFundMonths, int retentionYears, int minutesDeadline, int levyNoticeDays,
        decimal interestMax, int legalActionDays, decimal quoteThreshold, decimal urgentWorkMax) =>
        new Dictionary<RuleKey, decimal?>
        {
            [AgmNoticeDaysMin] = noticeDays,
            [AgmQuorumPercent] = quorum,
            [AgmQuorumFallbackMinutes] = quorumFallback,
            [AgmElectronicVotingAllowed] = electronicVoting ? 1 : 0,
            [VotingOrdinaryThreshold] = 0.50m,
            [VotingSpecialThreshold] = 0.75m,
            [FundsCapitalWorksRequired] = 1,
            [FundsAdminFundMinMonths] = adminFundMonths,
            [ComplianceRetentionYears] = retentionYears,
            [ComplianceAgmMinutesDeadlineDays] = minutesDeadline,
            [ComplianceLevyNoticeDays] = levyNoticeDays,
            [ArrearsInterestRateMaxPercent] = interestMax,
            [ArrearsLegalActionMinDays] = legalActionDays,
            [MaintenanceQuoteThreshold] = quoteThreshold,
            [MaintenanceUrgentWorkMax] = urgentWorkMax,
        }.ToFrozenDictionary();
}
