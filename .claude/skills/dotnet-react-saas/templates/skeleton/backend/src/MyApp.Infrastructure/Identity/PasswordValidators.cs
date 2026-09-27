using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MyApp.Application.Common.Services;
using MyApp.Domain.Identity;
using MyApp.Infrastructure.Options;
using MyApp.Infrastructure.Persistence;

namespace MyApp.Infrastructure.Identity;

/// <summary>Rejects passwords that appear in public breach corpuses.</summary>
public sealed class BreachedPasswordValidator(IPasswordBreachChecker checker, IOptions<SecurityOptions> options)
    : IPasswordValidator<ApplicationUser>
{
    public async Task<IdentityResult> ValidateAsync(UserManager<ApplicationUser> manager, ApplicationUser user, string? password)
    {
        if (!options.Value.BreachedPasswordCheck || string.IsNullOrEmpty(password))
        {
            return IdentityResult.Success;
        }

        var count = await checker.GetBreachCountAsync(password);
        return count > 0
            ? IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordBreached",
                Description = "This password has appeared in a known data breach. Please choose a different one.",
            })
            : IdentityResult.Success;
    }
}

/// <summary>Blocks reuse of the current password and the previous N (history stores outgoing passwords).</summary>
public sealed class PasswordHistoryValidator(AppDbContext db, IOptions<SecurityOptions> options)
    : IPasswordValidator<ApplicationUser>
{
    public async Task<IdentityResult> ValidateAsync(UserManager<ApplicationUser> manager, ApplicationUser user, string? password)
    {
        if (string.IsNullOrEmpty(password))
        {
            return IdentityResult.Success;
        }

        var recent = await db.PasswordHistory.AsNoTracking()
            .Where(h => h.UserId == user.Id)
            .OrderByDescending(h => h.CreatedAt)
            .Take(options.Value.PasswordHistoryDepth)
            .Select(h => h.PasswordHash)
            .ToListAsync();

        // The current hash is always checked too, so accounts without recorded history are still protected.
        if (!string.IsNullOrEmpty(user.PasswordHash))
        {
            recent.Add(user.PasswordHash);
        }

        var reused = recent.Any(hash =>
            manager.PasswordHasher.VerifyHashedPassword(user, hash, password) != PasswordVerificationResult.Failed);

        return reused
            ? IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordReused",
                Description = $"You cannot reuse any of your last {options.Value.PasswordHistoryDepth} passwords.",
            })
            : IdentityResult.Success;
    }
}

/// <summary>Rejects passwords containing the user's email local part or name.</summary>
public sealed class PersonalInfoPasswordValidator : IPasswordValidator<ApplicationUser>
{
    public Task<IdentityResult> ValidateAsync(UserManager<ApplicationUser> manager, ApplicationUser user, string? password)
    {
        var fragments = new[] { user.Email?.Split('@')[0], user.FirstName, user.LastName }
            .Where(f => f is { Length: >= 3 })
            .Select(f => f!);

        var containsPersonal = password is not null
            && fragments.Any(f => password.Contains(f, StringComparison.OrdinalIgnoreCase));

        return Task.FromResult(containsPersonal
            ? IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordPersonalInfo",
                Description = "Your password must not contain your name or email address.",
            })
            : IdentityResult.Success);
    }
}
