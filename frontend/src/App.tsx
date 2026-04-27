import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BoardList from "./pages/BoardList";
import BoardEditor from "./pages/BoardEditor";
import JoinBoard from "./pages/JoinBoard";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join/:inviteCode" element={<JoinBoard />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <BoardList />
          </PrivateRoute>
        }
      />
      <Route
        path="/board/:id"
        element={
          <PrivateRoute>
            <BoardEditor />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
