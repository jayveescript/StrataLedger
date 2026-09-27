using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Services;
using MyApp.Domain.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.Invitations;

/// <summary>Creates/reissues invitations and queues the branded email. Raw tokens never touch the database.</summary>
public sealed class InvitationService(
    IRepository<Invitation> invitations,
    ISecureTokenGenerator tokens,
    IEmailOutbox outbox,
    IAppUrls urls,
    TimeProvider clock)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(72);

    public async Task<Invitation> CreateAndSendAsync(Tenant tenant, Guid? batchId, string email, string firstName,
        string lastName, UserRole role, CancellationToken ct)
    {
        var token = tokens.Generate();
        var invitation = new Invitation(tenant.Id, batchId, email, firstName, lastName, role,
            tokens.Hash(token), clock.GetUtcNow().Add(Lifetime));
        invitations.Add(invitation);
        await SendAsync(tenant, invitation, token, ct);
        return invitation;
    }

    public async Task ReissueAndSendAsync(Tenant tenant, Invitation invitation, CancellationToken ct)
    {
        var token = tokens.Generate();
        invitation.Reissue(tokens.Hash(token), clock.GetUtcNow().Add(Lifetime));
        await SendAsync(tenant, invitation, token, ct);
    }

    private async Task SendAsync(Tenant tenant, Invitation invitation, string token, CancellationToken ct)
    {
        invitation.MarkSent(clock.GetUtcNow());
        await outbox.EnqueueAsync(tenant.Id, invitation.Email, $"{invitation.FirstName} {invitation.LastName}".Trim(),
            EmailTemplate.Invitation,
            new Dictionary<string, string>
            {
                ["name"] = invitation.FirstName,
                ["tenant"] = tenant.Name,
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
        [UserRole.TenantAdmin] = "Tenant Administrator",
        [UserRole.Manager] = "Manager",
        [UserRole.Viewer] = "Viewer",
        [UserRole.Member] = "Member",
    };

    private static readonly Dictionary<string, UserRole> Parse = new(StringComparer.OrdinalIgnoreCase)
    {
        ["member"] = UserRole.Member,
        ["viewer"] = UserRole.Viewer,
        ["auditor"] = UserRole.Viewer,
        ["manager"] = UserRole.Manager,
        ["tenant admin"] = UserRole.TenantAdmin,
        ["tenantadmin"] = UserRole.TenantAdmin,
        ["admin"] = UserRole.TenantAdmin,
    };

    public static string Get(UserRole role) => Labels.GetValueOrDefault(role, role.ToString());

    public static UserRole? TryParse(string? value) =>
        value is not null && Parse.TryGetValue(value.Trim(), out var role) ? role : null;
}
