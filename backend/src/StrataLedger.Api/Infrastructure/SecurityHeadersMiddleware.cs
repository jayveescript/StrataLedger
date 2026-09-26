namespace StrataLedger.Api.Infrastructure;

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers.XContentTypeOptions = "nosniff";
        headers.XFrameOptions = "DENY";
        headers["Referrer-Policy"] = "no-referrer";
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        headers["Cross-Origin-Opener-Policy"] = "same-origin";
        headers.ContentSecurityPolicy = "default-src 'none'; frame-ancestors 'none'";
        headers.CacheControl = context.Request.Path.StartsWithSegments("/api/v1/public") ? headers.CacheControl : "no-store";
        return next(context);
    }
}
