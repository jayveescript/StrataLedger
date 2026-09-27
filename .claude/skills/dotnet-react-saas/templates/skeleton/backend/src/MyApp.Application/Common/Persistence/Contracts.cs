using MyApp.Application.Common.Results;

namespace MyApp.Application.Common.Persistence;

/// <summary>
/// Generic repository. <see cref="Query"/> is no-tracking for LINQ projections in query handlers;
/// <see cref="QueryTracked"/> loads aggregates that commands will modify.
/// </summary>
public interface IRepository<T> where T : class
{
    IQueryable<T> Query();
    IQueryable<T> QueryTracked();
    Task<T?> FindAsync(Guid id, CancellationToken cancellationToken = default);
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);
    void Remove(T entity);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>Runs work in a retriable transaction; commits only when the result succeeds.</summary>
    Task<Result<T>> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<Result<T>>> work,
        CancellationToken cancellationToken = default);
}
