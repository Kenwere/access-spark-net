import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import UsersPage from "./pages/UsersPage";
import Payments from "./pages/Payments";
import Vouchers from "./pages/Vouchers";
import Routers from "./pages/Routers";
import Rankings from "./pages/Rankings";
import SettingsPage from "./pages/SettingsPage";
import CaptivePortal from "./pages/CaptivePortal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/routers" element={<Routers />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/portal" element={<CaptivePortal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
