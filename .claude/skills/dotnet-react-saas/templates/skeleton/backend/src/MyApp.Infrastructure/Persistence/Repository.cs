using Microsoft.EntityFrameworkCore;
using MyApp.Application.Common.Persistence;

namespace MyApp.Infrastructure.Persistence;

public sealed class Repository<T>(AppDbContext context) : IRepository<T> where T : class
{
    private readonly DbSet<T> _set = context.Set<T>();

    public IQueryable<T> Query() => _set.AsNoTracking();

    public IQueryable<T> QueryTracked() => _set;

    /// <summary>Goes through the query pipeline (not DbSet.Find) so tenant and soft-delete filters always apply.</summary>
    public Task<T?> FindAsync(Guid id, CancellationToken cancellationToken = default) =>
        _set.FirstOrDefaultAsync(e => EF.Property<Guid>(e, "Id") == id, cancellationToken);

    public void Add(T entity) => _set.Add(entity);

    public void AddRange(IEnumerable<T> entities) => _set.AddRange(entities);

    public void Remove(T entity) => _set.Remove(entity);
}
