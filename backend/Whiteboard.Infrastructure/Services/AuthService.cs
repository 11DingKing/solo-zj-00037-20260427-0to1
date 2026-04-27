using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Whiteboard.Core.DTOs;
using Whiteboard.Core.Entities;
using Whiteboard.Infrastructure.Data;

namespace Whiteboard.Infrastructure.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<User?> GetUserByIdAsync(Guid userId);
}

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IJwtService _jwtService;
    private static readonly string[] AvatarColors = new[]
    {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    };

    public AuthService(
        ApplicationDbContext context,
        IPasswordHasher<User> passwordHasher,
        IJwtService jwtService)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email || u.Username == request.Username))
        {
            return null;
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username,
            Email = request.Email,
            AvatarColor = GetRandomAvatarColor()
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return new AuthResponse(
            user.Id,
            user.Username,
            user.Email,
            token,
            user.AvatarColor ?? "#4ECDC4"
        );
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            return null;
        }

        var result = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result != PasswordVerificationResult.Success)
        {
            return null;
        }

        var token = _jwtService.GenerateToken(user);

        return new AuthResponse(
            user.Id,
            user.Username,
            user.Email,
            token,
            user.AvatarColor ?? "#4ECDC4"
        );
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }

    private static string GetRandomAvatarColor()
    {
        var random = new Random();
        return AvatarColors[random.Next(AvatarColors.Length)];
    }
}