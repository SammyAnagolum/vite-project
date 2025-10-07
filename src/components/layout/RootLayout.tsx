import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import HeaderBar from "./HeaderBar";

export default function RootLayout() {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 min-h-0 flex-col">
        <HeaderBar />
        <main className="flex-1 overflow-auto p-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
