namespace Whiteboard.Core.DTOs;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record AuthResponse(Guid UserId, string Username, string Email, string Token, string AvatarColor);

public record UserDto(Guid Id, string Username, string Email, string AvatarColor);