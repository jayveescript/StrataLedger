using Microsoft.Extensions.Options;
using MyApp.Application.Common.Services;
using MyApp.Infrastructure.Options;

namespace MyApp.Infrastructure.Security;

public sealed class AppUrls(IOptions<AppUrlOptions> options) : IAppUrls
{
    private string Web => options.Value.FrontendBaseUrl.TrimEnd('/');
    private string Api => options.Value.ApiBaseUrl.TrimEnd('/');

    public string AcceptInvitation(string token) => $"{Web}/invite/{Uri.EscapeDataString(token)}";

    public string ResetPassword(string email, string token) =>
        $"{Web}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

    public string Login() => $"{Web}/login";

    public string PublicFile(Guid fileId) => $"{Api}/api/v1/public/files/{fileId}";
}
