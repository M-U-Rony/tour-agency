"use client";

import { createContext, useContext } from "react";

const InsideSidebarContext = createContext<boolean>(false);

export function InsideSidebarProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: boolean;
}) {
  return (
    <InsideSidebarContext.Provider value={value}>
      {children}
    </InsideSidebarContext.Provider>
  );
}

export function useInsideSidebar() {
  return useContext(InsideSidebarContext);
}
