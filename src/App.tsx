import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Browse from "./pages/Browse";
import PostInvention from "./pages/PostInvention";
import AIBrainstorm from "./pages/AIBrainstorm";
import InventionDetail from "./pages/InventionDetail";
import NetworkLayout from "./pages/network/NetworkLayout";
import Feed from "./pages/network/Feed";
import Spark from "./pages/network/Spark";
import Inbox from "./pages/network/Inbox";
import Explore from "./pages/network/Explore";
import Profile from "./pages/Profile";
import SparkArena from "./pages/SparkArena";
import AdminDashboard from "./pages/AdminDashboard";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/inventions/:id" element={<InventionDetail />} />
              <Route path="/post" element={<PostInvention />} />
              <Route path="/ai-brainstorm" element={<AIBrainstorm />} />

              <Route path="/network" element={<NetworkLayout />}>
                <Route index element={<Feed />} />
                <Route path="feed" element={<Feed />} />
                <Route path="explore" element={<Explore />} />
                <Route path="spark" element={<Spark />} />
                <Route path="inbox" element={<Inbox />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              <Route path="/inventor-club" element={<NetworkLayout />}>
                <Route index element={<Feed />} />
              </Route>

              <Route path="/spark-arena" element={<SparkArena />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
