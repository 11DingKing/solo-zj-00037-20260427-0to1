using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;
using Whiteboard.Core.Entities;
using Whiteboard.Infrastructure.Data;
using Whiteboard.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Whiteboard API", Version = "v1" });
    
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("PostgreSQL");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Redis Configuration
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnectionString!));

// Custom password hashing (not using Identity framework)
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = builder.Configuration["Jwt:Key"];
    var jwtIssuer = builder.Configuration["Jwt:Issuer"];
    var jwtAudience = builder.Configuration["Jwt:Audience"];
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/ws"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Application Services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBoardService, BoardService>();
builder.Services.AddSingleton<IWebSocketService, WebSocketService>();

var app = builder.Build();

// Auto migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseWebSockets();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// WebSocket middleware
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/ws"))
    {
        if (context.WebSockets.IsWebSocketRequest)
        {
            var path = context.Request.Path.Value;
            if (!string.IsNullOrEmpty(path) && Guid.TryParse(path.Split('/').Last(), out var boardId))
            {
                var userIdClaim = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim?.Value;
                if (!string.IsNullOrEmpty(userId) && Guid.TryParse(userId, out var userGuid))
                {
                    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                    var webSocketService = context.RequestServices.GetRequiredService<IWebSocketService>();
                    await webSocketService.HandleWebSocketAsync(boardId, userGuid, webSocket);
                }
            }
        }
        else
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
        }
    }
    else
    {
        await next();
    }
});

app.MapControllers();

app.Run();
