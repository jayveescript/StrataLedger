using StrataLedger.Domain.Common;
using StrataLedger.Domain.Enums;

namespace StrataLedger.Domain.Strata;

public sealed class StrataPlan : TenantEntity
{
    private StrataPlan() { }

    public static StrataPlan Create(Guid companyId, string name, string planNumber, string address,
        AustralianState state, DateOnly financialYearStart, DateOnly? nextAgmDate) => new()
    {
        CompanyId = companyId,
        Name = name.Trim(),
        PlanNumber = planNumber.Trim().ToUpperInvariant(),
        Address = address.Trim(),
        State = state,
        FinancialYearStart = financialYearStart,
        NextAgmDate = nextAgmDate,
    };

    public string Name { get; private set; } = string.Empty;
    public string PlanNumber { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public AustralianState State { get; private set; }
    public PlanStatus Status { get; private set; } = PlanStatus.Active;
    public PlanHealth Health { get; private set; } = PlanHealth.Healthy;
    public DateOnly FinancialYearStart { get; private set; }
    public DateOnly? NextAgmDate { get; private set; }
    public decimal AdminFundBalance { get; private set; }
    public decimal CapitalWorksFundBalance { get; private set; }

    public List<Lot> Lots { get; private set; } = [];

    public void Update(string name, string address, AustralianState state, PlanStatus status, PlanHealth health,
        DateOnly financialYearStart, DateOnly? nextAgmDate)
    {
        Name = name.Trim();
        Address = address.Trim();
        State = state;
        Status = status;
        Health = health;
        FinancialYearStart = financialYearStart;
        NextAgmDate = nextAgmDate;
    }

    public void SetOpeningBalances(decimal adminFund, decimal capitalWorksFund)
    {
        AdminFundBalance = adminFund;
        CapitalWorksFundBalance = capitalWorksFund;
    }
}
