using CaddieResearch.Api.Data;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Workers;
using SeuProjeto.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BlobService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddHttpClient<AbacatePayService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<AcoesService>();
builder.Services.AddHttpClient<TaxasMacroeconomicasService>();
builder.Services.AddHttpClient("yahoo", c =>
{
    c.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
});


builder.Services.AddScoped<AcoesService>();
builder.Services.AddHttpClient<InternacionalService>();
builder.Services.AddScoped<InternacionalService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "chave-fallback-super-longa-para-desenvolvimento-local";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/notificacoes"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "https://ashy-flower-0221f7b10.7.azurestaticapps.net" 
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); 
    });
});

builder.Services.AddHostedService<CaddieResearch.Api.Workers.MacroCalendarioWorker>();
builder.Services.AddHostedService<BalancoCalendarioWorker>();
builder.Services.AddSignalR();
var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notificacoes");

app.Run();