using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.BackgroundJobs;

/// <summary>Delivers outbox emails with exponential backoff. Row locking lets several API instances run it safely.</summary>
public sealed partial class EmailOutboxWorker(IServiceScopeFactory scopes, TimeProvider clock, ILogger<EmailOutboxWorker> logger)
    : BackgroundService
{
    private const int BatchSize = 20;
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval, clock);
        do
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                LogBatchFailed(logger, ex);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessBatchAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<ITenantContext>().EnterPlatformScopeAsync(ct);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var now = clock.GetUtcNow();

        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        var batch = await db.EmailMessages
            .FromSqlInterpolated($"""
                SELECT * FROM email_messages
                WHERE status = {(int)EmailStatus.Pending} AND next_attempt_at <= {now}
                ORDER BY next_attempt_at
                LIMIT {BatchSize}
                FOR UPDATE SKIP LOCKED
                """)
            .ToListAsync(ct);

        foreach (var message in batch)
        {
            try
            {
                await sender.SendAsync(message.ToAddress, message.ToName, message.Subject, message.HtmlBody, message.TextBody, ct);
                message.MarkSent(clock.GetUtcNow());
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                message.MarkFailed(clock.GetUtcNow(), ex.Message);
                LogSendFailed(logger, message.Id, ex);
            }
        }

        await db.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Email outbox batch failed")]
    private static partial void LogBatchFailed(ILogger logger, Exception ex);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Sending email {MessageId} failed")]
    private static partial void LogSendFailed(ILogger logger, Guid messageId, Exception ex);
}
