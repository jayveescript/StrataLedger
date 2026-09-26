using FluentValidation;
using Microsoft.EntityFrameworkCore;
using StrataLedger.Application.Common.Messaging;
using StrataLedger.Application.Common.Models;
using StrataLedger.Application.Common.Persistence;
using StrataLedger.Application.Common.Results;
using StrataLedger.Application.Common.Security;
using StrataLedger.Application.Common.Services;
using StrataLedger.Application.Features.Invitations;
using StrataLedger.Domain.Companies;
using StrataLedger.Domain.Enums;
using StrataLedger.Domain.Identity;
using StrataLedger.Domain.Strata;

namespace StrataLedger.Application.Features.Strata;

public enum PortalAccessStatus
{
    None = 0,
    Invited = 1,
    Active = 2,
}

public sealed record OwnerListItem(Guid Id, string FirstName, string LastName, string Email, string? Phone, string? EntityName,
    int LotCount, PortalAccessStatus PortalStatus);

public sealed record OwnerLotDto(Guid LotId, string LotNumber, string? UnitNumber, Guid StrataPlanId, string PlanName,
    string PlanNumber, decimal SharePercent);

public sealed record OwnerDetail(Guid Id, string FirstName, string LastName, string Email, string? Phone, string? PostalAddress,
    string? EntityName, PortalAccessStatus PortalStatus, IReadOnlyList<OwnerLotDto> Lots);

[RequiresPermission(Permission.OwnersRead), RequiresFeature(Feature.StrataPlans)]
public sealed record ListOwnersQuery(string? Search, Guid? StrataPlanId, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<OwnerListItem>>;

public sealed class ListOwnersHandler(IRepository<Owner> owners, IRepository<Invitation> invitations)
    : IRequestHandler<ListOwnersQuery, PagedResult<OwnerListItem>>
{
    public async Task<Result<PagedResult<OwnerListItem>>> Handle(ListOwnersQuery request, CancellationToken cancellationToken)
    {
        var term = request.Search?.Trim().ToLower();
        var query = owners.Query()
            .WhereIf(!string.IsNullOrEmpty(term), o => o.FirstName.ToLower().Contains(term!) || o.LastName.ToLower().Contains(term!)
                || o.Email.Contains(term!) || (o.EntityName != null && o.EntityName.ToLower().Contains(term!)))
            .WhereIf(request.StrataPlanId.HasValue, o => o.Ownerships.Any(x => x.Lot!.StrataPlanId == request.StrataPlanId))
            .OrderBy(o => o.LastName).ThenBy(o => o.FirstName)
            .Select(o => new OwnerListItem(o.Id, o.FirstName, o.LastName, o.Email, o.Phone, o.EntityName, o.Ownerships.Count,
                o.UserId != null
                    ? PortalAccessStatus.Active
                    : invitations.Query().Any(i => i.Email == o.Email && i.Status == InvitationStatus.Pending)
                        ? PortalAccessStatus.Invited
                        : PortalAccessStatus.None));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.OwnersRead), RequiresFeature(Feature.StrataPlans)]
public sealed record GetOwnerQuery(Guid Id) : IQuery<OwnerDetail>;

public sealed class GetOwnerHandler(IRepository<Owner> owners, IRepository<Invitation> invitations)
    : IRequestHandler<GetOwnerQuery, OwnerDetail>
{
    public async Task<Result<OwnerDetail>> Handle(GetOwnerQuery request, CancellationToken cancellationToken)
    {
        var owner = await owners.Query()
            .Where(o => o.Id == request.Id)
            .Select(o => new OwnerDetail(o.Id, o.FirstName, o.LastName, o.Email, o.Phone, o.PostalAddress, o.EntityName,
                o.UserId != null
                    ? PortalAccessStatus.Active
                    : invitations.Query().Any(i => i.Email == o.Email && i.Status == InvitationStatus.Pending)
                        ? PortalAccessStatus.Invited
                        : PortalAccessStatus.None,
                o.Ownerships.Where(x => !x.Lot!.IsDeleted).Select(x => new OwnerLotDto(x.LotId, x.Lot!.LotNumber, x.Lot.UnitNumber,
                    x.Lot.StrataPlanId, x.Lot.StrataPlan!.Name, x.Lot.StrataPlan.PlanNumber, x.SharePercent)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        return owner is null ? Error.NotFound("Owner") : owner;
    }
}

public abstract record OwnerFields(string FirstName, string LastName, string Email, string? Phone, string? PostalAddress,
    string? EntityName);

public sealed class OwnerFieldsValidator : AbstractValidator<OwnerFields>
{
    public OwnerFieldsValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.PostalAddress).MaximumLength(300);
        RuleFor(x => x.EntityName).MaximumLength(200);
    }
}

[RequiresPermission(Permission.OwnersWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record CreateOwnerCommand(Guid? CompanyId, string FirstName, string LastName, string Email, string? Phone,
    string? PostalAddress, string? EntityName)
    : OwnerFields(FirstName, LastName, Email, Phone, PostalAddress, EntityName), ICommand<Guid>;

public sealed class CreateOwnerValidator : AbstractValidator<CreateOwnerCommand>
{
    public CreateOwnerValidator() => Include(new OwnerFieldsValidator());
}

public sealed class CreateOwnerHandler(ICurrentUser currentUser, IRepository<Owner> owners) : IRequestHandler<CreateOwnerCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateOwnerCommand request, CancellationToken cancellationToken)
    {
        var companyId = currentUser.ResolveCompany(request.CompanyId);
        if (companyId.IsFailure)
        {
            return companyId.Error!;
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (await owners.Query().AnyAsync(o => o.CompanyId == companyId.Value && o.Email == email, cancellationToken))
        {
            return Error.Conflict("owner.duplicate", "An owner with this email already exists.");
        }

        var owner = Owner.Create(companyId.Value, request.FirstName, request.LastName, email, request.Phone,
            request.PostalAddress, request.EntityName);
        owners.Add(owner);
        return owner.Id;
    }
}

[RequiresPermission(Permission.OwnersWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record UpdateOwnerCommand(Guid Id, string FirstName, string LastName, string Email, string? Phone,
    string? PostalAddress, string? EntityName)
    : OwnerFields(FirstName, LastName, Email, Phone, PostalAddress, EntityName), ICommand<Unit>;

public sealed class UpdateOwnerValidator : AbstractValidator<UpdateOwnerCommand>
{
    public UpdateOwnerValidator() => Include(new OwnerFieldsValidator());
}

public sealed class UpdateOwnerHandler(IRepository<Owner> owners) : IRequestHandler<UpdateOwnerCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateOwnerCommand request, CancellationToken cancellationToken)
    {
        var owner = await owners.FindAsync(request.Id, cancellationToken);
        if (owner is null)
        {
            return Error.NotFound("Owner");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        if (owner.UserId is not null && owner.Email != email)
        {
            return Error.Conflict("owner.email_locked", "The email of an owner with portal access is managed by the owner.");
        }

        owner.Update(request.FirstName, request.LastName, email, request.Phone, request.PostalAddress, request.EntityName);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.OwnersWrite), RequiresFeature(Feature.StrataPlans)]
public sealed record DeleteOwnerCommand(Guid Id) : ICommand<Unit>;

public sealed class DeleteOwnerHandler(IRepository<Owner> owners) : IRequestHandler<DeleteOwnerCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteOwnerCommand request, CancellationToken cancellationToken)
    {
        var owner = await owners.QueryTracked().Include(o => o.Ownerships).FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (owner is null)
        {
            return Error.NotFound("Owner");
        }

        if (owner.Ownerships.Count > 0)
        {
            return Error.Conflict("owner.has_lots", "Remove the owner from their lots before deleting them.");
        }

        owners.Remove(owner);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.OwnersInvite), RequiresFeature(Feature.OwnerPortal), RequiresFeature(Feature.OwnerInvitations)]
public sealed record InviteOwnerToPortalCommand(Guid OwnerId) : ICommand<Unit>;

public sealed class InviteOwnerToPortalHandler(
    IRepository<Owner> owners,
    IRepository<Company> companies,
    IRepository<Invitation> invitations,
    InvitationService invitationService) : IRequestHandler<InviteOwnerToPortalCommand, Unit>
{
    public async Task<Result<Unit>> Handle(InviteOwnerToPortalCommand request, CancellationToken cancellationToken)
    {
        var owner = await owners.Query().Include(o => o.Ownerships).ThenInclude(x => x.Lot)
            .FirstOrDefaultAsync(o => o.Id == request.OwnerId, cancellationToken);
        if (owner is null)
        {
            return Error.NotFound("Owner");
        }

        var alreadyPending = await invitations.Query()
            .AnyAsync(i => i.Email == owner.Email && i.Status == InvitationStatus.Pending, cancellationToken);
        if (owner.UserId is not null || alreadyPending)
        {
            return Error.Conflict("owner.already_invited", "This owner already has portal access or a pending invitation.");
        }

        var company = await companies.Query().FirstAsync(c => c.Id == owner.CompanyId, cancellationToken);
        var firstLot = owner.Ownerships.Select(o => o.Lot!).FirstOrDefault();
        await invitationService.CreateAndSendAsync(company, null, owner.Email, owner.FirstName, owner.LastName, UserRole.Owner,
            firstLot?.StrataPlanId, firstLot?.Id, cancellationToken);
        return Unit.Value;
    }
}
