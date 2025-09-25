import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import HeaderBar from "./HeaderBar";

export default function RootLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar />
        <main className="flex-1 p-6 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
