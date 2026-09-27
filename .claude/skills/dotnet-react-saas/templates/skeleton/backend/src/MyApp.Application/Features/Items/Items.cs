using FluentValidation;
using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Models;
using MyApp.Application.Common.Persistence;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Application.Features.Tenants;
using MyApp.Domain.Enums;
using MyApp.Domain.Items;

namespace MyApp.Application.Features.Items;

// Reference feature slice. Copy this file to add a module: DTOs, request records carrying their own
// [RequiresPermission]/[RequiresFeature], validators, and one small handler per request.

public sealed record ItemDto(Guid Id, string Name, string? Description, decimal Amount, ItemStatus Status, DateTimeOffset CreatedAt);

[RequiresPermission(Permission.ItemsRead), RequiresFeature(Feature.Items)]
public sealed record ListItemsQuery(string? Search, ItemStatus? Status, int Page = 1, int PageSize = 25)
    : PageRequest(Page, PageSize), IQuery<PagedResult<ItemDto>>;

public sealed class ListItemsHandler(IRepository<Item> items) : IRequestHandler<ListItemsQuery, PagedResult<ItemDto>>
{
    public async Task<Result<PagedResult<ItemDto>>> Handle(ListItemsQuery request, CancellationToken cancellationToken)
    {
        var term = request.Search?.Trim().ToLower();
        // Tenant + soft-delete filters are applied automatically; only business filters live here.
        var query = items.Query()
            .WhereIf(!string.IsNullOrEmpty(term), i => i.Name.ToLower().Contains(term!))
            .WhereIf(request.Status.HasValue, i => i.Status == request.Status)
            .OrderBy(i => i.Name)
            .Select(i => new ItemDto(i.Id, i.Name, i.Description, i.Amount, i.Status, i.CreatedAt));

        return await query.ToPagedResultAsync(request, cancellationToken);
    }
}

[RequiresPermission(Permission.ItemsRead), RequiresFeature(Feature.Items)]
public sealed record GetItemQuery(Guid Id) : IQuery<ItemDto>;

public sealed class GetItemHandler(IRepository<Item> items) : IRequestHandler<GetItemQuery, ItemDto>
{
    public async Task<Result<ItemDto>> Handle(GetItemQuery request, CancellationToken cancellationToken)
    {
        var item = await items.Query()
            .Where(i => i.Id == request.Id)
            .Select(i => new ItemDto(i.Id, i.Name, i.Description, i.Amount, i.Status, i.CreatedAt))
            .FirstOrDefaultAsync(cancellationToken);
        return item is null ? Error.NotFound("Item") : item;
    }
}

public abstract record ItemFields(string Name, string? Description, decimal Amount);

public sealed class ItemFieldsValidator : AbstractValidator<ItemFields>
{
    public ItemFieldsValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
    }
}

[RequiresPermission(Permission.ItemsWrite), RequiresFeature(Feature.Items)]
public sealed record CreateItemCommand(Guid? TenantId, string Name, string? Description, decimal Amount)
    : ItemFields(Name, Description, Amount), ICommand<Guid>;

public sealed class CreateItemValidator : AbstractValidator<CreateItemCommand>
{
    public CreateItemValidator() => Include(new ItemFieldsValidator());
}

public sealed class CreateItemHandler(ICurrentUser currentUser, IRepository<Item> items, UsageLimits limits)
    : IRequestHandler<CreateItemCommand, Guid>
{
    public async Task<Result<Guid>> Handle(CreateItemCommand request, CancellationToken cancellationToken)
    {
        var tenantId = currentUser.ResolveTenant(request.TenantId);
        if (tenantId.IsFailure)
        {
            return tenantId.Error!;
        }

        var limit = await limits.EnsureCanAddItemAsync(tenantId.Value, cancellationToken);
        if (limit.IsFailure)
        {
            return limit.Error!;
        }

        var item = Item.Create(tenantId.Value, request.Name, request.Description, request.Amount);
        items.Add(item);
        return item.Id;
    }
}

[RequiresPermission(Permission.ItemsWrite), RequiresFeature(Feature.Items)]
public sealed record UpdateItemCommand(Guid Id, string Name, string? Description, decimal Amount, ItemStatus Status)
    : ItemFields(Name, Description, Amount), ICommand<Unit>;

public sealed class UpdateItemValidator : AbstractValidator<UpdateItemCommand>
{
    public UpdateItemValidator()
    {
        Include(new ItemFieldsValidator());
        RuleFor(x => x.Status).IsInEnum();
    }
}

public sealed class UpdateItemHandler(IRepository<Item> items) : IRequestHandler<UpdateItemCommand, Unit>
{
    public async Task<Result<Unit>> Handle(UpdateItemCommand request, CancellationToken cancellationToken)
    {
        var item = await items.FindAsync(request.Id, cancellationToken);
        if (item is null)
        {
            return Error.NotFound("Item");
        }

        item.Update(request.Name, request.Description, request.Amount, request.Status);
        return Unit.Value;
    }
}

[RequiresPermission(Permission.ItemsWrite), RequiresFeature(Feature.Items)]
public sealed record DeleteItemCommand(Guid Id) : ICommand<Unit>;

public sealed class DeleteItemHandler(IRepository<Item> items) : IRequestHandler<DeleteItemCommand, Unit>
{
    public async Task<Result<Unit>> Handle(DeleteItemCommand request, CancellationToken cancellationToken)
    {
        var item = await items.FindAsync(request.Id, cancellationToken);
        if (item is null)
        {
            return Error.NotFound("Item");
        }

        items.Remove(item); // converted to a soft delete by the auditing interceptor
        return Unit.Value;
    }
}
