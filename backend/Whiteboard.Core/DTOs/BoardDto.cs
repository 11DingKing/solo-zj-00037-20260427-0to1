namespace Whiteboard.Core.DTOs;

public record CreateBoardRequest(string Name, string? Description);

public record UpdateBoardRequest(string? Name, string? Description);

public record BoardDto(
    Guid Id,
    string Name,
    string? Description,
    Guid OwnerId,
    string? InviteCode,
    string? ThumbnailUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int ParticipantCount,
    UserDto Owner);

public record BoardListItemDto(
    Guid Id,
    string Name,
    string? Description,
    string? ThumbnailUrl,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int ParticipantCount,
    bool IsOwner);

public record InviteLinkDto(string InviteCode, string InviteUrl);

public record JoinBoardRequest(string InviteCode);