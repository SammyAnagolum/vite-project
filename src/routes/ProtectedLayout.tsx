import { Navigate, Outlet } from "react-router-dom";
import { getUser } from "@/lib/authStorage";

export default function ProtectedLayout() {
  const user = getUser();
  return user ? <Outlet /> : <Navigate to="/signin" replace />;
}
