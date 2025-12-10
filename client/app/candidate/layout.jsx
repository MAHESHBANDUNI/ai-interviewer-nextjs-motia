"use client";

import React, { useState, ReactNode } from "react";
import HeaderDashboard from "../components/header/HeaderDashboard";
import Sidebar from "../components/Sidebar";


export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div
        className={`relative flex flex-1 flex-col transition-all duration-300 property_own overflow-auto ${
          isCollapsed ? "lg:ml-20" : "lg:ml-80"
        }`}
      >
        <HeaderDashboard
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main
          className={`mx-auto p-4 md:p-6 2xl:p-10 transition-all duration-300 ${
            isCollapsed ? "w-full" : "w-full"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
