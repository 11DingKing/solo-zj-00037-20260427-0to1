import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { boardApi } from "@/services/api";
import { useAuthStore } from "@/store";

const JoinBoard: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const joinBoard = async () => {
      if (!inviteCode) {
        setError("无效的邀请链接");
        setLoading(false);
        return;
      }

      if (!isAuthenticated || !token) {
        navigate(`/login?redirect=/join/${inviteCode}`);
        return;
      }

      try {
        const response = await boardApi.joinBoard(inviteCode);
        navigate(`/board/${response.data.id}`);
      } catch (err: any) {
        setError(err.response?.data?.message || "加入白板失败");
        setLoading(false);
      }
    };

    joinBoard();
  }, [inviteCode, isAuthenticated, token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加入白板...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          无法加入白板
        </h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors"
        >
          <span>返回首页</span>
        </button>
      </div>
    </div>
  );
};

export default JoinBoard;
