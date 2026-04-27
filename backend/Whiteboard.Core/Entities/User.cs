namespace Whiteboard.Core.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarColor { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Board> OwnedBoards { get; set; } = new List<Board>();
    public ICollection<BoardParticipant> ParticipatedBoards { get; set; } = new List<BoardParticipant>();
}