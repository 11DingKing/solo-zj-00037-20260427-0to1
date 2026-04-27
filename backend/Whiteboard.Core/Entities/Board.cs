namespace Whiteboard.Core.Entities;

public class Board
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid OwnerId { get; set; }
    public string? InviteCode { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User? Owner { get; set; }
    public ICollection<BoardElement> Elements { get; set; } = new List<BoardElement>();
    public ICollection<BoardParticipant> Participants { get; set; } = new List<BoardParticipant>();
}