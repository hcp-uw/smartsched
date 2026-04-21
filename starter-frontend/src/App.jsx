import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner";
import { AppProvider } from "./context/AppContext";
import { Calendar } from "./pages/Calendar";
import { BrowserRouter } from "react-router-dom";

export default function App() {
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