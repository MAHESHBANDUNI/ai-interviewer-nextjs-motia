"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Laptop, 
  User, 
  LogOut, 
  ChevronRight,
  Menu,
  X,
  SidebarIcon,
  Calendar,
  CheckCircle,
  XCircle,
  Briefcase
} from "lucide-react"
import { successToast, errorToast } from "@/app/components/ui/toast"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"

const navItemsAdmin = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/admin/candidates", icon: User },
  { name: "Interviews", href: "/admin/interviews", icon: Laptop },
  { name: 'Jobs', href: "/admin/jobs", icon: Briefcase}
]

const navItemsCandidate = [
  { 
    name: "Interviews", 
    href: "/candidate/interviews", 
    icon: Laptop,
    hasSubmenu: true,
    submenu: [
      { name: "Dashboard", href: "/candidate/interviews", icon: LayoutDashboard },
      { name: "Upcoming", href: "/candidate/interviews/upcoming", icon: Calendar },
      { name: "Completed", href: "/candidate/interviews/completed", icon: CheckCircle },
      { name: "Cancelled", href: "/candidate/interviews/cancelled", icon: XCircle }
    ]
  }
]

export default function Sidebar({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const sidebarRef = useRef(null)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Determine nav items
  const activeNavItems = session?.user?.role === 'Admin' 
    ? navItemsAdmin 
    : navItemsCandidate

  // Check if pathname matches any submenu item
  const getActiveSubmenu = (item) => {
    if (!item.submenu) return false;
    return item.submenu.some(subItem => pathname.startsWith(subItem.href));
  };

  // Click outside to close sidebar on mobile
  useEffect(() => {
    if (!sidebarOpen || !isMobile) return

    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [sidebarOpen, setSidebarOpen, isMobile])

  const handleCollapseToggle = () => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const handleSubmenuToggle = (itemName) => {
    if (activeSubmenu === itemName) {
      setActiveSubmenu(null)
    } else {
      setActiveSubmenu(itemName)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirect: true, callbackUrl: "/auth/signin" })
      successToast("Logged out successfully")
    } catch (error) {
      errorToast("Logout failed. Please try again.")
    }
  }

  if (status === "loading") {
    return (
      <aside className="fixed inset-y-0 left-0 z-[100] bg-gray-50 w-20 lg:w-64 border-r border-gray-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </aside>
    )
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={isMobile ? { x: -320 } : false}
        animate={{ 
          x: sidebarOpen || !isMobile ? 0 : -320 
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200
          shadow-xl z-[100] flex flex-col overflow-hidden
          ${isCollapsed && !isMobile ? "w-20" : "w-80"}
          ${isMobile ? "w-80" : ""}
        `}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? "justify-center" : ""}`}>
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      AI INTERVIEWER
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {session?.user?.role === 'Admin' ? 'Admin Portal' : 'Candidate Portal'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Close/Collapse Button */}
            <button
              onClick={handleCollapseToggle}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label={isMobile ? "Close menu" : "Toggle sidebar"}
            >
              {isMobile ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : isCollapsed ? (
                <SidebarIcon className="w-5 h-5 text-gray-600" />
              ) : (
                <SidebarIcon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-1">
            <p className={`px-4 text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3 
              ${(isCollapsed && !isMobile) ? "hidden" : "block"}`}>
              Main Menu
            </p>
            
            {activeNavItems.map((item) => {
              const isActive = pathname === item.href || getActiveSubmenu(item);
              const isCollapsedState = isCollapsed && !isMobile;
              const Icon = item.icon;
              const hasSubmenu = item.hasSubmenu;
              const isSubmenuOpen = activeSubmenu === item.name;

              return (
                <div key={item.name}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="relative">
                      {hasSubmenu ? (
                        <button
                          onClick={() => handleSubmenuToggle(item.name)}
                          className={`
                            flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                              ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                            ${isCollapsedState ? "justify-center px-3" : ""}
                            cursor-pointer
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Icon size={20} className={isActive ? "text-blue-600" : "text-gray-800"} />
                            </div>
                            
                            <AnimatePresence>
                              {(!isCollapsed || isMobile) && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  className="font-medium text-sm text-gray-800"
                                >
                                  {item.name}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>

                          <AnimatePresence>
                            {(!isCollapsed || isMobile) && hasSubmenu && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={`transform transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}
                              >
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive
                              ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                            ${isCollapsedState ? "justify-center px-3" : ""}
                          `}
                          onClick={() => isMobile && setSidebarOpen(false)}
                        >
                          <div className="relative">
                            <Icon size={20} className={isActive ? "text-blue-600" : "text-gray-800"} />
                          </div>
                          
                          <AnimatePresence>
                            {(!isCollapsed || isMobile) && (
                              <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="font-medium text-sm text-gray-800"
                              >
                                {item.name}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      )}
                    </div>
                  </motion.div>

                  {/* Submenu Items */}
                  <AnimatePresence>
                    {hasSubmenu && isSubmenuOpen && (!isCollapsed || isMobile) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 mt-1 pl-4 border-l border-gray-200 space-y-1 overflow-hidden"
                      >
                        {item.submenu.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = pathname === subItem.href;
                          const isDashboard = subItem.name === "Dashboard";
                          
                          return (
                            <motion.div
                              key={subItem.href}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Link
                                href={subItem.href}
                                className={`
                                  flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200
                                  ${isSubActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                                `}
                                onClick={() => isMobile && setSidebarOpen(false)}
                              >
                                <div className="flex items-center gap-3">
                                  <SubIcon className={`w-4 h-4 ${isSubActive ? "text-blue-600" : "text-gray-500"}`} />
                                  <span className="text-sm font-medium">{subItem.name}</span>
                                </div>
                                
                              </Link>
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

        </nav>

        {/* Footer / Logout */}
        <div className="border-t border-gray-200 p-4">
          {/* User Profile Section */}
          <div className="mb-4">
            <AnimatePresence>
              {(!isCollapsed || isMobile) && session?.user && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {session.user.name?.charAt(0) || 
                         session.user.email?.charAt(0) || 
                         "U"}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                    </div>
                        
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-semibold text-sm truncate">
                        {session.user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user.email}
                      </p>
                      {session.user.role && (
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                          session.user.role === 'Admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {session.user.role}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
            
          {/* Logout Button */}
          <motion.button
            onClick={handleLogout}
            className={`
              cursor-pointer flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200
              bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:text-gray-900
              border border-gray-200 hover:border-gray-300 shadow-sm
              ${(isCollapsed && !isMobile) ? "justify-center px-3" : "gap-3"}
              group
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <LogOut 
              size={20} 
              className={`${(isCollapsed && !isMobile) ? "" : "flex-shrink-0"} text-gray-600 group-hover:text-gray-800`}
            />

            <AnimatePresence mode="wait">
              {(!isCollapsed || isMobile) && (
                <motion.span
                  key="logout-text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="font-medium text-sm text-gray-700 truncate"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
            
          {/* Version Info */}
          <div className="mt-4">
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  {/* <p className="text-xs text-gray-400">
                    v1.2.0 • AI Interviewer Pro
                  </p> */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  )
}