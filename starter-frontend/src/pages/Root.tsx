import { Outlet } from "react-router";
import { Sidebar } from "../components/Sidebar";

export function Root() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
