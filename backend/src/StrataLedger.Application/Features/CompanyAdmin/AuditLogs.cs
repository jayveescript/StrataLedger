using Microsoft.AspNetCore.Identity;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Models;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Audit;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;

namespace StrataLedger.Application.Features.CompanyAdmin;

public sealed record AuditLogDto(Guid Id, DateTimeOffset Timestamp, AuditAction Action, string EntityType, string? EntityId,
    Guid? UserId, string? UserEmail, string? Changes, string? IpAddress);

[RequiresPermission(Permission.CompanyAuditRead), RequiresFeature(Feature.AuditLog)]
public sealed record ListAuditLogsQuery(Guid? CompanyId, AuditAction? Action, string? EntityType, Guid? UserId,
    DateTimeOffset? From, DateTimeOffset? To, int Page = 1, int PageSize = 50)
    : PageRequest(Page, PageSize), IQuery<PagedResult<AuditLogDto>>;

public sealed class ListAuditLogsHandler(ICurrentUser currentUser, IRepository<AuditLog> logs, UserManager<ApplicationUser> users)
    : IRequestHandler<ListAuditLogsQuery, PagedResult<AuditLogDto>>
{
    public async Task<Result<PagedResult<AuditLogDto>>> Handle(ListAuditLogsQuery request, CancellationToken cancellationToken)
    {
        // Super Admin may omit the company to see platform-wide events.
        var scope = currentUser.IsSuperAdmin && request.CompanyId is null
            ? Result<Guid?>.Success(null)
            : currentUser.ResolveCompany(request.CompanyId).Match(id => Result<Guid?>.Success(id), Result<Guid?>.Failure);
        if (scope.IsFailure)
        {
            return scope.Error!;
        }

        var companyId = scope.Value;
        var query = logs.Query()
            .WhereIf(companyId.HasValue, l => l.CompanyId == companyId)
            .WhereIf(request.Action.HasValue, l => l.Action == request.Action)
            .WhereIf(!string.IsNullOrWhiteSpace(request.EntityType), l => l.EntityType == request.EntityType)
            .WhereIf(request.UserId.HasValue, l => l.UserId == request.UserId)
            .WhereIf(request.From.HasValue, l => l.Timestamp >= request.From)
            .WhereIf(request.To.HasValue, l => l.Timestamp <= request.To)
            .OrderByDescending(l => l.Timestamp)
            .Select(l => new AuditLogDto(l.Id, l.Timestamp, l.Action, l.EntityType, l.EntityId, l.UserId,
                users.Users.Where(u => u.Id == l.UserId).Select(u => u.Email).FirstOrDefault(),
                l.Changes, l.IpAddress));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}
