namespace Whiteboard.Core.DTOs;

public enum WsMessageType
{
    Join,
    Leave,
    CursorMove,
    ElementCreate,
    ElementUpdate,
    ElementDelete,
    BatchOperation,
    SelectionUpdate,
    UserList,
    Error
}

public record WsMessage<T>(WsMessageType Type, T Payload, long Timestamp, string? UserId = null);

public record CursorPayload(double X, double Y, string Color);

public record ElementPayload(Guid ElementId, string ElementType, string Data);

public record BatchOperationPayload(ElementPayload[] CreateElements, Guid[] DeleteElementIds, ElementPayload[] UpdateElements);

public record SelectionPayload(Guid[] ElementIds);

public record OnlineUserDto(string UserId, string Username, string AvatarColor, bool IsOnline);

public record JoinPayload(Guid BoardId, string UserId, string Username, string AvatarColor);

public record ErrorPayload(string Message);