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