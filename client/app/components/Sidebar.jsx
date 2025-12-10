"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Laptop, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  Settings,
  HelpCircle,
  Briefcase,
  Bell,
  SidebarIcon
} from "lucide-react"
import { successToast, errorToast } from "@/app/components/ui/toast"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"

const navItemsAdmin = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Candidates", href: "/admin/candidates", icon: User },
  { name: "Interviews", href: "/admin/interview", icon: Laptop }
]

const navItemsCandidate = [
  { name: "Interviews", href: "/candidate/interviews", icon: Laptop }
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
          fixed top-0 left-0 h-full bg-gradient-to-b from-white to-gray-50 border-r border-gray-200
          shadow-xl z-[100] flex flex-col overflow-hidden
          ${isCollapsed && !isMobile ? "w-20" : "w-80"}
          ${isMobile ? "w-80" : ""}
        `}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isCollapsed && !isMobile ? "justify-center" : ""}`}>
              {/* <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div> */}
              
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
            
            {activeNavItems.map(({ name, href, icon: Icon }) => {
              const isActive = pathname === href
              const isCollapsedState = isCollapsed && !isMobile

              return (
                <motion.div
                  key={href}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Link
                    href={href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive
                        ? " bg-gray-200 text-white shadow-sm shadow-gray-500/20"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                      ${isCollapsedState ? "justify-center px-3" : ""}
                    `}
                    onClick={() => isMobile && setSidebarOpen(false)}
                  >
                    <div className="relative">
                      <Icon size={20} className={isActive ? "text-gray-900" : "text-gray-800"} />
                      {/* {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -right-1 -top-1 w-2 h-2 bg-black rounded-full"
                        />
                      )} */}
                    </div>
                    
                    <AnimatePresence>
                      {(!isCollapsed || isMobile) && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="font-medium text-sm text-gray-800"
                        >
                          {name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {/* {isActive && (!isCollapsed || isMobile) && (
                      <div className="ml-auto w-2 h-2 bg-gray-700 rounded-full"></div>
                    )} */}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* Divider */}
          <div className={`my-6 border-t border-gray-200 ${(isCollapsed && !isMobile) ? "hidden" : "block"}`}></div>

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
                className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {session.user.name?.charAt(0) || 
                       session.user.email?.charAt(0) || 
                       "U"}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                      
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-semibold text-sm truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.user.email}
                    </p>
                    {session.user.role && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
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
            bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900
            border border-gray-100 hover:border-gray-200
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
                <p className="text-xs text-gray-400">
                  v1.1.0 • Interview AI
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </motion.aside>

      {/* Mobile Menu Button */}
      {/* {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 p-2 bg-white rounded-xl shadow-lg border border-gray-200 z-[99] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
      )} */}
    </>
  )
}