namespace Whiteboard.Core.Entities;

public class BoardParticipant
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "viewer";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Board? Board { get; set; }
    public User? User { get; set; }
}