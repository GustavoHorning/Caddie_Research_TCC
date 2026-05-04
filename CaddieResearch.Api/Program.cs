using CaddieResearch.Api.Data;
using CaddieResearch.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Adicionando os Controllers
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Banco de Dados na Azure SQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Os seus serviços atuais
builder.Services.AddScoped<BlobService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<TokenService>();

// O serviço de Pagamentos do AbacatePay
builder.Services.AddHttpClient<AbacatePayService>();

// Configuração do JWT
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
    });

// Liberação de CORS (para o React conseguir conversar com a API na nuvem)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();