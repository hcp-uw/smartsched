
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import { Calendar } from "./pages/Calendar";
import { Login } from "./pages/Login";
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

  const loginWithGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: "google" });
  };


  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AppProvider>
          <Calendar />
          <Toaster />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
  
}
