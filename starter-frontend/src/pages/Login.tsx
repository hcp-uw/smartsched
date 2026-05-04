import { useState } from "react";
//import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";
import { supabase } from "../supabaseClient";

export function Login() {
  //const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Login error:", error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-[#E6EAF0] to-[#F7F9FC] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* LOGO PLACEHOLDER */}
          {/* Replace below div with: <img src="YOUR_LOGO_PATH" /> */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5B8DEF] to-[#8B5CF6] shadow-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-semibold bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] bg-clip-text text-transparent mb-2">
            SmartSched
          </h1>

          <p className="text-muted-foreground">
            AI-Powered Scheduling & Task Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Welcome
          </h2>

          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#5B8DEF] to-[#8B5CF6] hover:opacity-90 transition-opacity"
          >
            {loading ? "Redirecting..." : "Continue with Google"}
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Secure login powered by Google & Supabase
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms & Privacy Policy
        </div>
      </div>
    </div>
  );
}