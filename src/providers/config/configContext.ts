import { createContext } from "react";

interface ConfigContextProps {
  config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const ConfigContext = createContext<ConfigContextProps | undefined>(undefined);
