import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import HeaderBar from "./HeaderBar";

export default function RootLayout() {
  const { pathname } = useLocation();
  const title =
    pathname.startsWith("/cr") ? "Central Registry" :
      pathname.startsWith("/iam") ? "IAM" :
        pathname.startsWith("/reports") ? "Reports" : "Ops Console";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <HeaderBar />
        <main className="flex-1 p-6 py-4">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
