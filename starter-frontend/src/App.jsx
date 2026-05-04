/*
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./pages/Home";
import { Calendar } from "./pages/Calendar";
import { Login } from "./pages/Login";
import { Tasks } from "./pages/Tasks";
import { Profile } from "./pages/Profile";
import { AIPlanner } from "./pages/AIPlanner";

import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
//import { Calendar } from "./pages/Calendar";
//import { Login } from "./pages/Login";
import { BrowserRouter } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AppProvider>
          <Routes>
          <Toaster />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}*/

import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { router } from "./routes";
import { AppProvider } from "./context/AppContext";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AppProvider>
    </ThemeProvider>
  );
}