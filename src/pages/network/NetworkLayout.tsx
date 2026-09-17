import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/network/BottomNav";
import { SideRail } from "@/components/network/SideRail";

export default function NetworkLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <SideRail />
        <main className="flex-1 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
