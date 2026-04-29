using Microsoft.EntityFrameworkCore;
using Whiteboard.Core.DTOs;
using Whiteboard.Core.Entities;
using Whiteboard.Infrastructure.Data;

namespace Whiteboard.Infrastructure.Services;

public interface IBoardService
{
    Task<BoardDto?> CreateBoardAsync(Guid ownerId, CreateBoardRequest request);
    Task<BoardDto?> GetBoardAsync(Guid boardId, Guid userId);
    Task<IEnumerable<BoardListItemDto>> GetUserBoardsAsync(Guid userId);
    Task<BoardDto?> UpdateBoardAsync(Guid boardId, Guid userId, UpdateBoardRequest request);
    Task<bool> DeleteBoardAsync(Guid boardId, Guid userId);
    Task<InviteLinkDto?> GenerateInviteLinkAsync(Guid boardId, Guid userId);
    Task<BoardDto?> JoinBoardByInviteCodeAsync(string inviteCode, Guid userId);
    Task<bool> UpdateBoardThumbnailAsync(Guid boardId, string thumbnailUrl);
    Task<List<BoardElement>> GetBoardElementsAsync(Guid boardId);
    Task SaveBoardElementsAsync(Guid boardId, List<object> elements);
}

public class BoardService : IBoardService
{
    private readonly ApplicationDbContext _context;

    public BoardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<BoardDto?> CreateBoardAsync(Guid ownerId, CreateBoardRequest request)
    {
        var board = new Board
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            OwnerId = ownerId,
            InviteCode = GenerateInviteCode()
        };

        var participant = new BoardParticipant
        {
            Id = Guid.NewGuid(),
            BoardId = board.Id,
            UserId = ownerId,
            Role = "owner"
        };

        _context.Boards.Add(board);
        _context.BoardParticipants.Add(participant);
        await _context.SaveChangesAsync();

        return await MapToBoardDto(board, ownerId);
    }

    public async Task<BoardDto?> GetBoardAsync(Guid boardId, Guid userId)
    {
        var isParticipant = await _context.BoardParticipants
            .AnyAsync(p => p.BoardId == boardId && p.UserId == userId);

        if (!isParticipant)
        {
            return null;
        }

        var board = await _context.Boards
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board == null)
        {
            return null;
        }

        return await MapToBoardDto(board, userId);
    }

    public async Task<IEnumerable<BoardListItemDto>> GetUserBoardsAsync(Guid userId)
    {
        var boards = await _context.Boards
            .Include(b => b.Owner)
            .Include(b => b.Participants)
            .Where(b => b.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(b => b.UpdatedAt)
            .ToListAsync();

        return boards.Select(b => new BoardListItemDto(
            b.Id,
            b.Name,
            b.Description,
            b.ThumbnailUrl,
            b.CreatedAt,
            b.UpdatedAt,
            b.Participants.Count,
            b.OwnerId == userId
        ));
    }

    public async Task<BoardDto?> UpdateBoardAsync(Guid boardId, Guid userId, UpdateBoardRequest request)
    {
        var board = await _context.Boards
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board == null || board.OwnerId != userId)
        {
            return null;
        }

        if (!string.IsNullOrEmpty(request.Name))
        {
            board.Name = request.Name;
        }

        if (request.Description != null)
        {
            board.Description = request.Description;
        }

        await _context.SaveChangesAsync();

        return await MapToBoardDto(board, userId);
    }

    public async Task<bool> DeleteBoardAsync(Guid boardId, Guid userId)
    {
        var board = await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == boardId && b.OwnerId == userId);

        if (board == null)
        {
            return false;
        }

        _context.Boards.Remove(board);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<InviteLinkDto?> GenerateInviteLinkAsync(Guid boardId, Guid userId)
    {
        var board = await _context.Boards
            .FirstOrDefaultAsync(b => b.Id == boardId && b.OwnerId == userId);

        if (board == null)
        {
            return null;
        }

        board.InviteCode = GenerateInviteCode();
        await _context.SaveChangesAsync();

        return new InviteLinkDto(
            board.InviteCode,
            $"/join/{board.InviteCode}"
        );
    }

    public async Task<BoardDto?> JoinBoardByInviteCodeAsync(string inviteCode, Guid userId)
    {
        var board = await _context.Boards
            .Include(b => b.Owner)
            .FirstOrDefaultAsync(b => b.InviteCode == inviteCode);

        if (board == null)
        {
            return null;
        }

        var existingParticipant = await _context.BoardParticipants
            .FirstOrDefaultAsync(p => p.BoardId == board.Id && p.UserId == userId);

        if (existingParticipant != null)
        {
            return await MapToBoardDto(board, userId);
        }

        var participant = new BoardParticipant
        {
            Id = Guid.NewGuid(),
            BoardId = board.Id,
            UserId = userId,
            Role = "editor"
        };

        _context.BoardParticipants.Add(participant);
        await _context.SaveChangesAsync();

        return await MapToBoardDto(board, userId);
    }

    public async Task<bool> UpdateBoardThumbnailAsync(Guid boardId, string thumbnailUrl)
    {
        var board = await _context.Boards.FindAsync(boardId);
        if (board == null)
        {
            return false;
        }

        board.ThumbnailUrl = thumbnailUrl;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<BoardElement>> GetBoardElementsAsync(Guid boardId)
    {
        return await _context.BoardElements
            .Where(e => e.BoardId == boardId)
            .OrderBy(e => e.Order)
            .ToListAsync();
    }

    public async Task SaveBoardElementsAsync(Guid boardId, List<object> elements)
    {
        var existingElements = await _context.BoardElements
            .Where(e => e.BoardId == boardId)
            .ToListAsync();

        _context.BoardElements.RemoveRange(existingElements);

        var newElements = new List<BoardElement>();
        for (int i = 0; i < elements.Count; i++)
        {
            var element = new BoardElement
            {
                Id = Guid.NewGuid(),
                BoardId = boardId,
                Type = "canvas-element",
                Data = System.Text.Json.JsonSerializer.Serialize(elements[i]),
                Order = i,
            };
            newElements.Add(element);
        }

        _context.BoardElements.AddRange(newElements);
        await _context.SaveChangesAsync();
    }

    private async Task<BoardDto> MapToBoardDto(Board board, Guid userId)
    {
        var participantCount = await _context.BoardParticipants
            .CountAsync(p => p.BoardId == board.Id);

        return new BoardDto(
            board.Id,
            board.Name,
            board.Description,
            board.OwnerId,
            board.OwnerId == userId ? board.InviteCode : null,
            board.ThumbnailUrl,
            board.CreatedAt,
            board.UpdatedAt,
            participantCount,
            new UserDto(
                board.Owner!.Id,
                board.Owner.Username,
                board.Owner.Email,
                board.Owner.AvatarColor ?? "#4ECDC4"
            )
        );
    }

    private static string GenerateInviteCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }
}