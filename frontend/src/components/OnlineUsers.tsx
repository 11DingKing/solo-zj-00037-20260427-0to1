import React from "react";
import { Users } from "lucide-react";
import { useCollaborationStore } from "@/store";

const OnlineUsers: React.FC = () => {
  const { onlineUsers, cursorPositions } = useCollaborationStore();

  const activeUsers = onlineUsers.filter((u) => u.isOnline);

  if (activeUsers.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[180px]">
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-gray-500" />
          <span className="text-xs font-medium text-gray-500">在线用户</span>
        </div>
        <span className="text-xs text-green-500 font-medium">
          {activeUsers.length} 在线
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {activeUsers.map((user) => (
          <div
            key={user.userId}
            className="px-3 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
          >
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user.username}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;
