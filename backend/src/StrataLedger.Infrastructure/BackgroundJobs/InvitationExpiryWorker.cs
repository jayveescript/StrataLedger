using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using StrataLedger.Application.Common.Services;
using StrataLedger.Domain.Enums;
using StrataLedger.Infrastructure.Persistence;

namespace StrataLedger.Infrastructure.BackgroundJobs;

/// <summary>Marks overdue invitations expired and purges long-dead refresh tokens.</summary>
public sealed partial class InvitationExpiryWorker(IServiceScopeFactory scopes, TimeProvider clock, ILogger<InvitationExpiryWorker> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, clock);
        do
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync(stoppingToken);
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var now = clock.GetUtcNow();

                await db.Invitations.IgnoreQueryFilters()
                    .Where(i => i.Status == InvitationStatus.Pending && i.ExpiresAt <= now)
                    .ExecuteUpdateAsync(s => s.SetProperty(i => i.Status, InvitationStatus.Expired), stoppingToken);

                var purgeBefore = now.AddDays(-30);
                await db.RefreshTokens.Where(t => t.ExpiresAt < purgeBefore).ExecuteDeleteAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                LogFailed(logger, ex);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Invitation expiry sweep failed")]
    private static partial void LogFailed(ILogger logger, Exception ex);
}
