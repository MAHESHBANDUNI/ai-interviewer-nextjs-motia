"use client";

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 bg-white shadow-md">
      <div className="text-xl font-bold">AI Interviewer</div>
      <nav className="space-x-4 hidden md:block">
        <a href="/auth/signin" className="text-gray-700 hover:text-blue-500">Login</a>
      </nav>
      <button className="md:hidden">
        {/* Hamburger icon (mobile menu placeholder) */}
      </button>
    </header>
  )
}
