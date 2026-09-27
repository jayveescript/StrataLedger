using Microsoft.AspNetCore.Identity;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Models;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Audit;
using MyApp.Domain.Enums;
using MyApp.Domain.Identity;

namespace MyApp.Application.Features.TenantAdmin;

public sealed record AuditLogDto(Guid Id, DateTimeOffset Timestamp, AuditAction Action, string EntityType, string? EntityId,
    Guid? UserId, string? UserEmail, string? Changes, string? IpAddress);

[RequiresPermission(Permission.TenantAuditRead), RequiresFeature(Feature.AuditLog)]
public sealed record ListAuditLogsQuery(Guid? TenantId, AuditAction? Action, string? EntityType, Guid? UserId,
    DateTimeOffset? From, DateTimeOffset? To, int Page = 1, int PageSize = 50)
    : PageRequest(Page, PageSize), IQuery<PagedResult<AuditLogDto>>;

public sealed class ListAuditLogsHandler(ICurrentUser currentUser, IRepository<AuditLog> logs, UserManager<ApplicationUser> users)
    : IRequestHandler<ListAuditLogsQuery, PagedResult<AuditLogDto>>
{
    public async Task<Result<PagedResult<AuditLogDto>>> Handle(ListAuditLogsQuery request, CancellationToken cancellationToken)
    {
        // Super Admin may omit the tenant to see platform-wide events.
        var scope = currentUser.IsSuperAdmin && request.TenantId is null
            ? Result<Guid?>.Success(null)
            : currentUser.ResolveTenant(request.TenantId).Match(id => Result<Guid?>.Success(id), Result<Guid?>.Failure);
        if (scope.IsFailure)
        {
            return scope.Error!;
        }

        var tenantId = scope.Value;
        var query = logs.Query()
            .WhereIf(tenantId.HasValue, l => l.TenantId == tenantId)
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
