using Abp.Domain.Uow;
using Abp.Runtime.Security;
using MosaicTalent.Authorization.Users;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MosaicTalent.Web.Host.Startup
{
    public static class AuthConfigurer
    {
        public static void Configure(IServiceCollection services, IConfiguration configuration)
        {
            if (bool.Parse(configuration["Authentication:JwtBearer:IsEnabled"]))
            {
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = "JwtBearer";
                    options.DefaultChallengeScheme = "JwtBearer";
                }).AddJwtBearer("JwtBearer", options =>
                {
                    options.Audience = configuration["Authentication:JwtBearer:Audience"];

                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        // The signing key must match!
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(configuration["Authentication:JwtBearer:SecurityKey"])),

                        // Validate the JWT Issuer (iss) claim
                        ValidateIssuer = true,
                        ValidIssuer = configuration["Authentication:JwtBearer:Issuer"],

                        // Validate the JWT Audience (aud) claim
                        ValidateAudience = true,
                        ValidAudience = configuration["Authentication:JwtBearer:Audience"],

                        // Validate the token expiry
                        ValidateLifetime = true,

                        // If you want to allow a certain amount of clock drift, set that here
                        ClockSkew = TimeSpan.Zero
                    };

                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = QueryStringTokenResolver,
                        OnTokenValidated = ValidateUserExistsAsync,
                        OnChallenge = async context =>
                        {
                            context.HandleResponse();
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";
                            var error = new
                            {
                                error = "Token is stale or user does not exist. Please login again."
                            };
                            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(error));
                        }
                    };
                });
            }
        }

        private static async Task ValidateUserExistsAsync(TokenValidatedContext context)
        {
            var userId = context.Principal?.Claims
                .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)
                ?.Value;

            if (string.IsNullOrWhiteSpace(userId))
            {
                context.Fail("Invalid token: missing user id claim.");
                return;
            }

            // Read the tenantId claim from the token. Without scoping the UserManager
            // lookup to the correct tenant, ABP queries in host context (TenantId = null),
            // finds no user, and fails validation — even though the user exists and the
            // token is perfectly valid.
            var tenantIdRaw = context.Principal?.Claims
                .FirstOrDefault(c => c.Type == "http://www.aspnetboilerplate.com/identity/claims/tenantId")
                ?.Value;

            int? tenantId = null;
            if (!string.IsNullOrWhiteSpace(tenantIdRaw) && int.TryParse(tenantIdRaw, out var parsedTenantId))
            {
                tenantId = parsedTenantId;
            }

            var userManager = context.HttpContext.RequestServices.GetService<UserManager>();
            if (userManager == null)
            {
                context.Fail("Authentication service unavailable.");
                return;
            }

            var unitOfWorkManager = context.HttpContext.RequestServices.GetService<IUnitOfWorkManager>();
            if (unitOfWorkManager == null)
            {
                context.Fail("Authentication service unavailable.");
                return;
            }

            User user;
            using (var uow = unitOfWorkManager.Begin())
            using (unitOfWorkManager.Current.SetTenantId(tenantId))
            {
                user = await userManager.FindByIdAsync(userId);
                uow.Complete();
            }

            if (user == null || user.IsDeleted || !user.IsActive)
            {
                context.Fail("Token belongs to a non-existent or inactive user.");
            }
        }

        /* This method is needed to authorize SignalR javascript client.
         * SignalR can not send authorization header. So, we are getting it from query string as an encrypted text. */
        private static Task QueryStringTokenResolver(MessageReceivedContext context)
        {
            if (!context.HttpContext.Request.Path.HasValue ||
                !context.HttpContext.Request.Path.Value.StartsWith("/signalr"))
            {
                // We are just looking for signalr clients
                return Task.CompletedTask;
            }

            var accessToken = context.HttpContext.Request.Query["access_token"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(accessToken))
            {
                context.Token = accessToken;
                return Task.CompletedTask;
            }

            var qsAuthToken = context.HttpContext.Request.Query["enc_auth_token"].FirstOrDefault();
            if (qsAuthToken == null)
            {
                // Cookie value does not matches to querystring value
                return Task.CompletedTask;
            }

            // Set auth token from cookie
            context.Token = SimpleStringCipher.Instance.Decrypt(qsAuthToken);
            return Task.CompletedTask;
        }
    }
}
