namespace Whiteboard.Core.Entities;

public class BoardElement
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Board? Board { get; set; }
}