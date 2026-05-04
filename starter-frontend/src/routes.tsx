import { createBrowserRouter } from "react-router-dom";
import { Root } from "./pages/Root";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Tasks } from "./pages/Tasks";
import { AIPlanner } from "./pages/AIPlanner";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "calendar", element: <Calendar /> },
      { path: "tasks", element: <Tasks /> },
      { path: "ai-planner", element: <AIPlanner /> },
      { path: "profile", element: <Profile /> },
    ],
  },
]);