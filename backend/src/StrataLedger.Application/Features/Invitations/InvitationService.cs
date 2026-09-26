using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Application.Features.Invitations;

/// <summary>Creates/reissues invitations and queues the branded email. Raw tokens never touch the database.</summary>
public sealed class InvitationService(
    IRepository<Invitation> invitations,
    ISecureTokenGenerator tokens,
    IEmailOutbox outbox,
    IAppUrls urls,
    TimeProvider clock)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(72);

    public async Task<Invitation> CreateAndSendAsync(Company company, Guid? batchId, string email, string firstName,
        string lastName, UserRole role, Guid? planId, Guid? lotId, CancellationToken ct)
    {
        var token = tokens.Generate();
        var invitation = new Invitation(company.Id, batchId, email, firstName, lastName, role, planId, lotId,
            tokens.Hash(token), clock.GetUtcNow().Add(Lifetime));
        invitations.Add(invitation);
        await SendAsync(company, invitation, token, ct);
        return invitation;
    }

    public async Task ReissueAndSendAsync(Company company, Invitation invitation, CancellationToken ct)
    {
        var token = tokens.Generate();
        invitation.Reissue(tokens.Hash(token), clock.GetUtcNow().Add(Lifetime));
        await SendAsync(company, invitation, token, ct);
    }

    private async Task SendAsync(Company company, Invitation invitation, string token, CancellationToken ct)
    {
        invitation.MarkSent(clock.GetUtcNow());
        await outbox.EnqueueAsync(company.Id, invitation.Email, $"{invitation.FirstName} {invitation.LastName}".Trim(),
            EmailTemplate.Invitation,
            new Dictionary<string, string>
            {
                ["name"] = invitation.FirstName,
                ["company"] = company.Name,
                ["role"] = RoleLabels.Get(invitation.Role),
                ["url"] = urls.AcceptInvitation(token),
                ["expiresHours"] = ((int)Lifetime.TotalHours).ToString(),
            }, ct);
    }
}

public static class RoleLabels
{
    private static readonly Dictionary<UserRole, string> Labels = new()
    {
        [UserRole.SuperAdmin] = "Platform Administrator",
        [UserRole.CompanyAdmin] = "Company Administrator",
        [UserRole.StrataManager] = "Strata Manager",
        [UserRole.Accountant] = "Accountant / Auditor",
        [UserRole.Owner] = "Owner",
    };

    private static readonly Dictionary<string, UserRole> Parse = new(StringComparer.OrdinalIgnoreCase)
    {
        ["owner"] = UserRole.Owner,
        ["accountant"] = UserRole.Accountant,
        ["auditor"] = UserRole.Accountant,
        ["strata manager"] = UserRole.StrataManager,
        ["stratamanager"] = UserRole.StrataManager,
        ["manager"] = UserRole.StrataManager,
        ["company admin"] = UserRole.CompanyAdmin,
        ["companyadmin"] = UserRole.CompanyAdmin,
        ["admin"] = UserRole.CompanyAdmin,
    };

    public static string Get(UserRole role) => Labels.GetValueOrDefault(role, role.ToString());

    public static UserRole? TryParse(string? value) =>
        value is not null && Parse.TryGetValue(value.Trim(), out var role) ? role : null;
}
