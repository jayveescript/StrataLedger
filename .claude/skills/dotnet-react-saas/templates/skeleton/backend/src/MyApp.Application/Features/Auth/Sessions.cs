using MyApp.Application.Common.Messaging;
using MyApp.Application.Common.Results;
using MyApp.Application.Common.Security;
using MyApp.Application.Common.Services;
using MyApp.Domain.Enums;

namespace MyApp.Application.Features.Auth;

[AllowAnonymousRequest, NonTransactional]
public sealed record RefreshSessionCommand(string RefreshToken) : ICommand<AuthTokens>;

public sealed class RefreshSessionHandler(IAuthSessionService sessions) : IRequestHandler<RefreshSessionCommand, AuthTokens>
{
    public async Task<Result<AuthTokens>> Handle(RefreshSessionCommand request, CancellationToken cancellationToken) =>
        string.IsNullOrWhiteSpace(request.RefreshToken)
            ? AuthErrors.InvalidRefreshToken
            : await sessions.RefreshAsync(request.RefreshToken, cancellationToken);
}

[AllowAnonymousRequest, NonTransactional]
public sealed record LogoutCommand(string? RefreshToken) : ICommand<Unit>;

public sealed class LogoutHandler(IAuthSessionService sessions, ICurrentUser currentUser, IAuditWriter audit)
    : IRequestHandler<LogoutCommand, Unit>
{
    public async Task<Result<Unit>> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            await sessions.EndSessionAsync(request.RefreshToken, cancellationToken);
        }

        if (currentUser.UserId is { } userId)
        {
            await audit.WriteSecurityEventAsync(AuditAction.Logout, userId, currentUser.TenantId, null, cancellationToken);
        }

        return Unit.Value;
    }
}
