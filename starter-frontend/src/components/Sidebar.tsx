import { Link, useLocation } from "react-router";
import { Home, Calendar, CheckSquare, Sparkles, User, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";


const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/ai-planner", label: "AI Planner", icon: Sparkles },
  { path: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col sticky top-0">
      {/* Top */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3 group">
          
          {/* Logo */}
          <div className="w-16 h-16 flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/logo.png"
              alt="SmartSched"
              className="w-60 h-60 object-contain"
            />
          </div>

          {/* Text */}
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] bg-clip-text text-transparent">
              SmartSched
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-Powered Planning
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative block"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-accent rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <div
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${isActive ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.icon === Sparkles && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] animate-pulse" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="font-medium">Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
