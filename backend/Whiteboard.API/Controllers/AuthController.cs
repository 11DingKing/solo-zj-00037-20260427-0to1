using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Whiteboard.Core.DTOs;
using Whiteboard.Infrastructure.Services;

namespace Whiteboard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Register attempt for username: {Username}, email: {Email}", request.Username, request.Email);
            
            var result = await _authService.RegisterAsync(request);
            if (result == null)
            {
                _logger.LogWarning("Registration failed: Email or username already exists");
                return BadRequest(new { Message = "Email or username already exists" });
            }

            _logger.LogInformation("Registration successful for user: {UserId}", result.UserId);
            return CreatedAtAction(nameof(Register), result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Registration failed with exception");
            return StatusCode(500, new { Message = "Internal server error during registration" });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            
            var result = await _authService.LoginAsync(request);
            if (result == null)
            {
                _logger.LogWarning("Login failed: Invalid email or password for {Email}", request.Email);
                return Unauthorized(new { Message = "Invalid email or password" });
            }

            _logger.LogInformation("Login successful for user: {UserId}", result.UserId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login failed with exception");
            return StatusCode(500, new { Message = "Internal server error during login" });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                _logger.LogWarning("GetCurrentUser: User ID claim not found");
                return Unauthorized();
            }

            var userId = Guid.Parse(userIdClaim);
            var user = await _authService.GetUserByIdAsync(userId);

            if (user == null)
            {
                _logger.LogWarning("GetCurrentUser: User not found for ID {UserId}", userId);
                return NotFound();
            }

            return Ok(new UserDto(
                user.Id,
                user.Username,
                user.Email,
                user.AvatarColor ?? "#4ECDC4"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetCurrentUser failed with exception");
            return StatusCode(500, new { Message = "Internal server error" });
        }
    }
}