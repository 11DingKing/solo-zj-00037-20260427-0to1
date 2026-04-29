using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Whiteboard.Core.DTOs;
using Whiteboard.Core.Entities;
using Whiteboard.Infrastructure.Services;

namespace Whiteboard.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BoardsController : ControllerBase
{
    private readonly IBoardService _boardService;

    public BoardsController(IBoardService boardService)
    {
        _boardService = boardService;
    }

    private Guid CurrentUserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BoardListItemDto>>> GetUserBoards()
    {
        var boards = await _boardService.GetUserBoardsAsync(CurrentUserId);
        return Ok(boards);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BoardDto>> GetBoard(Guid id)
    {
        var board = await _boardService.GetBoardAsync(id, CurrentUserId);
        if (board == null)
        {
            return NotFound();
        }

        return Ok(board);
    }

    [HttpGet("{id}/elements")]
    public async Task<ActionResult<List<BoardElement>>> GetBoardElements(Guid id)
    {
        var elements = await _boardService.GetBoardElementsAsync(id);
        return Ok(elements);
    }

    [HttpPost]
    public async Task<ActionResult<BoardDto>> CreateBoard([FromBody] CreateBoardRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var board = await _boardService.CreateBoardAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(GetBoard), new { id = board!.Id }, board);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BoardDto>> UpdateBoard(Guid id, [FromBody] UpdateBoardRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var board = await _boardService.UpdateBoardAsync(id, CurrentUserId, request);
        if (board == null)
        {
            return NotFound();
        }

        return Ok(board);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBoard(Guid id)
    {
        var success = await _boardService.DeleteBoardAsync(id, CurrentUserId);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id}/invite")]
    public async Task<ActionResult<InviteLinkDto>> GenerateInviteLink(Guid id)
    {
        var inviteLink = await _boardService.GenerateInviteLinkAsync(id, CurrentUserId);
        if (inviteLink == null)
        {
            return NotFound();
        }

        return Ok(inviteLink);
    }

    [HttpPost("join")]
    public async Task<ActionResult<BoardDto>> JoinBoard([FromBody] JoinBoardRequest request)
    {
        var board = await _boardService.JoinBoardByInviteCodeAsync(request.InviteCode, CurrentUserId);
        if (board == null)
        {
            return NotFound(new { Message = "Invalid invite code" });
        }

        return Ok(board);
    }

    [HttpPost("{id}/thumbnail")]
    public async Task<IActionResult> UpdateThumbnail(Guid id, [FromBody] string thumbnailUrl)
    {
        var success = await _boardService.UpdateBoardThumbnailAsync(id, thumbnailUrl);
        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPut("{id}/elements")]
    public async Task<IActionResult> SaveBoardElements(Guid id, [FromBody] List<object> elements)
    {
        await _boardService.SaveBoardElementsAsync(id, elements);
        return NoContent();
    }
}