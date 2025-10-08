import { useContext } from "react";
import { ConfigContext } from "./configContext";

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within a ConfigProvider");
  return ctx.config;
};
