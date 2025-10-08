import React from "react";
import { ConfigContext } from "./configContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ConfigProvider: React.FC<{ config: any; children: React.ReactNode }> = ({ config, children }) => {
  return <ConfigContext.Provider value={{ config }}>{children}</ConfigContext.Provider>;
};
