"use client";

import { ChevronDown, UserCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function HeaderDashboard({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const {data:session} = useSession();
  
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between lg:justify-end p-6 w-full bg-white drop-shadow-md dark:bg-boxdark dark:drop-shadow-none">
        
        {/* Mobile hamburger toggle */}
        <div className="lg:hidden inline-flex gap-2 sm:gap-4" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg
            className="w-6 h-6 text-gray-500 cursor-pointer"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>

          <div>
           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              AI INTERVIEWER
            </h1>
          </div>
        </div>

        {/* Right side user menu */}
        <div className="flex items-center space-x-4 gap-2">
          <p className="m-0">Hello, {session?.user?.name}</p>
          <UserCircle className="w-7 h-7 m-0 bg-black text-white rounded-xl" />
          {/* <ChevronDown className="w-7 h-7 m-0" /> */}
        </div>

    </header>
  );
}
