using CaddieResearch.Api.Data;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using CaddieResearch.Api.Hubs;
using CaddieResearch.Api.Interfaces;
using CaddieResearch.Api.Workers;
using Scalar.AspNetCore; 

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<BlobService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<IAssinaturaService, AssinaturaService>();
builder.Services.AddScoped<INotificacaoService, NotificacaoService>();
builder.Services.AddScoped<IBuscaService, BuscaService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IHistoricoService, HistoricoService>();
builder.Services.AddScoped<IMercadoService, MercadoService>();
builder.Services.AddScoped<IPortfolioService, PortfolioService>();
builder.Services.AddScoped<IRecomendacoesService, RecomendacoesService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IWatchlistAbasService, WatchlistAbasService>();
builder.Services.AddScoped<IForumService, ForumService>();
builder.Services.AddScoped<IAportesService, AportesService>();
builder.Services.AddScoped<IAtivosService, AtivosService>();
builder.Services.AddHttpClient<IAuthService, AuthService>();
builder.Services.AddScoped<ICalendarioService, CalendarioService>();
builder.Services.AddScoped<ICarteirasService, CarteirasService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IFavoritosService, FavoritosService>();
builder.Services.AddHttpClient<IInternacionalService, InternacionalService>();
builder.Services.AddScoped<IMorningCallService, MorningCallService>();
builder.Services.AddHttpClient<IAbacatePayService, AbacatePayService>();
builder.Services.AddScoped<IRelatoriosService, RelatoriosService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();

builder.Services.AddHttpClient<AbacatePayService>();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IAcoesService, AcoesService>();
builder.Services.AddHttpClient<TaxasMacroeconomicasService>();
builder.Services.AddHttpClient("yahoo", c =>
{
    c.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");
});
builder.Services.AddHttpClient<InternacionalService>();
builder.Services.AddHttpClient<ITaxasMacroeconomicasService, TaxasMacroeconomicasService>();
builder.Services.AddHttpClient<IInternacionalService, InternacionalService>();

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
        options.Events = new JwtBearerEvents
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

builder.Services.AddHostedService<MacroCalendarioWorker>();
builder.Services.AddHostedService<BalancoCalendarioWorker>();
builder.Services.AddSignalR();

builder.Services.AddApplicationInsightsTelemetry();
var app = builder.Build();

app.MapOpenApi(); 
app.MapScalarApiReference(options => 
{
    options.WithTitle("Caddie Research API");
    options.WithTheme(ScalarTheme.Mars); 
    options.WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Axios); 
});

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notificacoes");

app.Run();