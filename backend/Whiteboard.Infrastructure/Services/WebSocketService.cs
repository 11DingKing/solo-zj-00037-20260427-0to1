using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Whiteboard.Core.DTOs;
using Whiteboard.Core.Entities;
using Whiteboard.Infrastructure.Data;

namespace Whiteboard.Infrastructure.Services;

public interface IWebSocketService
{
    Task HandleWebSocketAsync(Guid boardId, Guid userId, WebSocket webSocket);
    Task BroadcastToBoardAsync<T>(Guid boardId, WsMessage<T> message, string? excludeUserId = null);
    Task UpdateOnlineUsersAsync(Guid boardId);
}

public class WebSocketService : IWebSocketService
{
    private readonly ILogger<WebSocketService> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly IServiceProvider _serviceProvider;
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, WebSocket>> _boardConnections;
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<string, OnlineUserDto>> _boardUsers;
    private readonly JsonSerializerOptions _jsonOptions;

    public WebSocketService(
        ILogger<WebSocketService> logger,
        IConnectionMultiplexer redis,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _redis = redis;
        _serviceProvider = serviceProvider;
        _boardConnections = new ConcurrentDictionary<Guid, ConcurrentDictionary<string, WebSocket>>();
        _boardUsers = new ConcurrentDictionary<Guid, ConcurrentDictionary<string, OnlineUserDto>>();
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    }

    public async Task HandleWebSocketAsync(Guid boardId, Guid userId, WebSocket webSocket)
    {
        var userIdString = userId.ToString();
        
        AddConnection(boardId, userIdString, webSocket);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
            var user = await authService.GetUserByIdAsync(userId);

            if (user != null)
            {
                AddUser(boardId, new OnlineUserDto(
                    userIdString,
                    user.Username,
                    user.AvatarColor ?? "#4ECDC4",
                    true
                ));

                await UpdateOnlineUsersAsync(boardId);

                var joinMessage = new WsMessage<JoinPayload>(
                    WsMessageType.Join,
                    new JoinPayload(
                        boardId,
                        userIdString,
                        user.Username,
                        user.AvatarColor ?? "#4ECDC4"
                    ),
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    userIdString
                );

                await BroadcastToBoardAsync(boardId, joinMessage, userIdString);
            }

            var buffer = new byte[4096];
            WebSocketReceiveResult result;

            do
            {
                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Text && result.Count > 0)
                {
                    var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    await HandleIncomingMessage(boardId, userIdString, message);
                }

            } while (!result.CloseStatus.HasValue);

            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebSocket error for user {UserId} on board {BoardId}", userId, boardId);
        }
        finally
        {
            RemoveConnection(boardId, userIdString);
            RemoveUser(boardId, userIdString);
            await UpdateOnlineUsersAsync(boardId);

            var leaveMessage = new WsMessage<string>(
                WsMessageType.Leave,
                userIdString,
                DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                userIdString
            );

            await BroadcastToBoardAsync(boardId, leaveMessage);
        }
    }

    private async Task HandleIncomingMessage(Guid boardId, string userId, string messageJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(messageJson);
            var root = doc.RootElement;

            if (!root.TryGetProperty("type", out var typeElement))
            {
                return;
            }

            var messageType = Enum.Parse<WsMessageType>(typeElement.GetString() ?? "Error");

            switch (messageType)
            {
                case WsMessageType.CursorMove:
                    var cursorPayload = JsonSerializer.Deserialize<WsMessage<CursorPayload>>(messageJson, _jsonOptions);
                    if (cursorPayload != null)
                    {
                        var cursorWithUser = cursorPayload with { UserId = userId };
                        await BroadcastToBoardAsync(boardId, cursorWithUser, userId);
                    }
                    break;

                case WsMessageType.ElementCreate:
                case WsMessageType.ElementUpdate:
                case WsMessageType.ElementDelete:
                case WsMessageType.BatchOperation:
                case WsMessageType.SelectionUpdate:
                    var genericMessage = JsonSerializer.Deserialize<JsonElement>(messageJson, _jsonOptions);
                    genericMessage = genericMessage.TryGetProperty("userId", out _) 
                        ? genericMessage 
                        : JsonSerializer.Deserialize<JsonElement>(
                            JsonSerializer.Serialize(
                                new { type = messageType, payload = genericMessage.GetProperty("payload"), timestamp = genericMessage.GetProperty("timestamp"), userId }
                            )
                        );
                    await BroadcastToBoardAsync(boardId, JsonSerializer.Serialize(genericMessage, _jsonOptions), userId);
                    break;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling WebSocket message");
        }
    }

    public async Task BroadcastToBoardAsync<T>(Guid boardId, WsMessage<T> message, string? excludeUserId = null)
    {
        var messageJson = JsonSerializer.Serialize(message, _jsonOptions);
        await BroadcastToBoardAsync(boardId, messageJson, excludeUserId);
    }

    public async Task BroadcastToBoardAsync(Guid boardId, string messageJson, string? excludeUserId = null)
    {
        if (!_boardConnections.TryGetValue(boardId, out var connections))
        {
            return;
        }

        var messageBytes = Encoding.UTF8.GetBytes(messageJson);
        var buffer = new ArraySegment<byte>(messageBytes);

        var tasks = new List<Task>();

        foreach (var kvp in connections)
        {
            if (excludeUserId != null && kvp.Key == excludeUserId)
            {
                continue;
            }

            var webSocket = kvp.Value;
            if (webSocket.State == WebSocketState.Open)
            {
                tasks.Add(webSocket.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None));
            }
        }

        await Task.WhenAll(tasks);
    }

    public async Task UpdateOnlineUsersAsync(Guid boardId)
    {
        if (!_boardUsers.TryGetValue(boardId, out var users))
        {
            return;
        }

        var userList = users.Values.ToList();
        var message = new WsMessage<List<OnlineUserDto>>(
            WsMessageType.UserList,
            userList,
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        );

        await BroadcastToBoardAsync(boardId, message);
    }

    private void AddConnection(Guid boardId, string userId, WebSocket webSocket)
    {
        var connections = _boardConnections.GetOrAdd(boardId, _ => new ConcurrentDictionary<string, WebSocket>());
        connections.AddOrUpdate(userId, webSocket, (_, _) => webSocket);
    }

    private void RemoveConnection(Guid boardId, string userId)
    {
        if (_boardConnections.TryGetValue(boardId, out var connections))
        {
            connections.TryRemove(userId, out _);
            if (connections.IsEmpty)
            {
                _boardConnections.TryRemove(boardId, out _);
            }
        }
    }

    private void AddUser(Guid boardId, OnlineUserDto user)
    {
        var users = _boardUsers.GetOrAdd(boardId, _ => new ConcurrentDictionary<string, OnlineUserDto>());
        users.AddOrUpdate(user.UserId, user, (_, _) => user);
    }

    private void RemoveUser(Guid boardId, string userId)
    {
        if (_boardUsers.TryGetValue(boardId, out var users))
        {
            users.TryRemove(userId, out _);
            if (users.IsEmpty)
            {
                _boardUsers.TryRemove(boardId, out _);
            }
        }
    }
}