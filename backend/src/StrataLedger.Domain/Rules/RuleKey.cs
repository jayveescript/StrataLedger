namespace StrataLedger.Domain.Rules;

/// <summary>How a company (L2) or plan (L3) value relates to the state (L1) value for the same rule.</summary>
public enum RuleConstraint
{
    /// <summary>State value is a floor; overrides may only be stricter (higher).</summary>
    Minimum = 1,

    /// <summary>State value is a ceiling; overrides may only be stricter (lower).</summary>
    Maximum,

    /// <summary>Set by legislation; overrides are ignored.</summary>
    Fixed,

    /// <summary>Any override value is accepted (e.g. opting out of electronic voting).</summary>
    Override,
}

public enum RuleUnit
{
    Days = 1,
    Minutes,
    Months,
    Years,
    Ratio,
    PercentPerAnnum,
    Dollars,
    Boolean,
}

/// <summary>A rule in the state → company → plan hierarchy. Values are decimals; booleans are stored as 1/0.</summary>
public sealed record RuleKey(
    string Path,
    RuleConstraint Constraint,
    RuleUnit Unit,
    string Label,
    string Description,
    bool CompanyOverridable = false,
    bool PlanOverridable = false);

/// <summary>The rule catalogue, ported from the prototype's L1 rules and resolver override map.</summary>
public static class RuleKeys
{
    public static readonly RuleKey AgmNoticeDaysMin = new("agm.noticeDaysMin", RuleConstraint.Minimum, RuleUnit.Days,
        "AGM notice period", "Minimum days notice required before an AGM", CompanyOverridable: true, PlanOverridable: true);

    public static readonly RuleKey AgmQuorumPercent = new("agm.quorumPercent", RuleConstraint.Fixed, RuleUnit.Ratio,
        "AGM quorum", "Minimum proportion of lots required for a valid quorum");

    public static readonly RuleKey AgmQuorumFallbackMinutes = new("agm.quorumFallbackMinutes", RuleConstraint.Fixed,
        RuleUnit.Minutes, "Quorum fallback", "Minutes after the scheduled start a meeting can proceed without quorum");

    public static readonly RuleKey AgmElectronicVotingAllowed = new("agm.electronicVotingAllowed", RuleConstraint.Override,
        RuleUnit.Boolean, "Electronic voting", "Whether electronic voting is permitted (a plan may opt out)",
        PlanOverridable: true);

    public static readonly RuleKey VotingOrdinaryThreshold = new("voting.ordinaryResolutionThreshold",
        RuleConstraint.Fixed, RuleUnit.Ratio, "Ordinary resolution", "Proportion of votes required for an ordinary motion");

    public static readonly RuleKey VotingSpecialThreshold = new("voting.specialResolutionThreshold",
        RuleConstraint.Fixed, RuleUnit.Ratio, "Special resolution", "Proportion of entitled votes required for a special resolution");

    public static readonly RuleKey FundsCapitalWorksRequired = new("funds.capitalWorksRequired", RuleConstraint.Fixed,
        RuleUnit.Boolean, "Capital works fund", "Whether a capital works fund is legally required");

    public static readonly RuleKey FundsAdminFundMinMonths = new("funds.adminFundMinMonths", RuleConstraint.Minimum,
        RuleUnit.Months, "Admin fund reserve", "Minimum months of operating expenses to hold in the admin fund");

    public static readonly RuleKey ComplianceRetentionYears = new("compliance.retentionYears", RuleConstraint.Minimum,
        RuleUnit.Years, "Records retention", "Minimum years to retain financial and governance records",
        CompanyOverridable: true);

    public static readonly RuleKey ComplianceAgmMinutesDeadlineDays = new("compliance.agmMinutesDeadlineDays",
        RuleConstraint.Maximum, RuleUnit.Days, "AGM minutes deadline", "Maximum days after an AGM to distribute minutes");

    public static readonly RuleKey ComplianceLevyNoticeDays = new("compliance.levyNoticeDays", RuleConstraint.Minimum,
        RuleUnit.Days, "Levy notice period", "Minimum days between issuing a levy notice and its due date");

    public static readonly RuleKey ArrearsInterestRateMaxPercent = new("arrears.interestRateMaxPercent",
        RuleConstraint.Maximum, RuleUnit.PercentPerAnnum, "Arrears interest rate", "Maximum annual interest on overdue levies");

    public static readonly RuleKey ArrearsLegalActionMinDays = new("arrears.legalActionMinDays", RuleConstraint.Minimum,
        RuleUnit.Days, "Legal action delay", "Minimum days overdue before commencing legal debt recovery");

    public static readonly RuleKey MaintenanceQuoteThreshold = new("maintenance.quoteThreshold", RuleConstraint.Maximum,
        RuleUnit.Dollars, "Quote threshold", "Job cost above which multiple quotes are required",
        CompanyOverridable: true, PlanOverridable: true);

    public static readonly RuleKey MaintenanceUrgentWorkMax = new("maintenance.urgentWorkMax", RuleConstraint.Maximum,
        RuleUnit.Dollars, "Urgent work limit", "Maximum spend on urgent works without committee approval");

    public static readonly IReadOnlyList<RuleKey> All =
    [
        AgmNoticeDaysMin, AgmQuorumPercent, AgmQuorumFallbackMinutes, AgmElectronicVotingAllowed,
        VotingOrdinaryThreshold, VotingSpecialThreshold, FundsCapitalWorksRequired, FundsAdminFundMinMonths,
        ComplianceRetentionYears, ComplianceAgmMinutesDeadlineDays, ComplianceLevyNoticeDays,
        ArrearsInterestRateMaxPercent, ArrearsLegalActionMinDays, MaintenanceQuoteThreshold, MaintenanceUrgentWorkMax,
    ];

    public static RuleKey? Find(string path) => All.FirstOrDefault(k => k.Path == path);
}
