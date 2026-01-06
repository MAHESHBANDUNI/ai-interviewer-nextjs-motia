"use client"
import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { Eye, EyeOff } from "lucide-react";

export default function SignupForm() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [animate, setAnimate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setAnimate(true)
  }, [])

  const handleSubmit = async(e) => {
    e.preventDefault()
    setIsSubmitting(true);

    if (!email || !password || !phone || !firstName || !lastName) {
      setError("Please fill in all fields.")
      return
    }
    setError("");

    try{
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      });
      if(!res.ok){
        errorToast('Kindly verify your credentials.')
        return;
      }
      if(res.ok){
        try{
          const result = await signIn("credentials", {
            email: email.trim(),
            password: password,
            redirect: false,
          });
          if(result.ok){
            successToast('Signup successfully');
            const session = await getSession();
            if (session?.user?.role) {
              switch (session.user.role) {
                case "admin":
                  window.location.href = "/admin/dashboard";
                  break;
                case "candidate":
                  window.location.href = "/candidate/interview";
                  break;
                default:
                  window.location.href = "/";
              }
            } else {
              window.location.href = "/";
            }
          }
          if(!result.ok){
            console.error("Error: ",result.error);
            errorToast('Kindly verify your credentials.')
          }
        }
        catch(err){
          console.error("Error: ",err);
          errorToast('Kindly verify your credentials.')
        }
      }
    }
    catch(err){
      console.error("Error: ",err);
      errorToast('Kindly verify your credentials.')
      return;
    }
    finally{
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          0% {opacity: 0;}
          100% {opacity: 1;}
        }
        .animateFadeIn {
          animation: fadeIn 0.5s ease-in forwards;
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 via-white to-blue-200">
        <div
          className={`w-full max-w-md rounded-xl shadow-lg bg-white p-8 transform transition-all duration-700 ease-out
            ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="mb-6 text-center text-3xl font-semibold text-gray-800">Create an Account</h2>
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out focus:shadow-lg"
                placeholder="John"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out focus:shadow-lg"
                placeholder="Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out focus:shadow-lg"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                autoComplete="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out focus:shadow-lg"
                placeholder="89090-80809"
                required
              />
            </div>

            {/* PASSWORD + LUCIDE EYE ICON */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-2 pr-10 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out focus:shadow-lg"
                  placeholder="••••••••"
                  required
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-2 cursor-pointer text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </span>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm opacity-0 animateFadeIn">{error}</p>}

            <button
              type="submit"
              className="cursor-pointer w-full py-2 px-4 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300"
            >
             {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/auth/signin" className="text-blue-600 hover:underline text-sm">Already have an account? Log in</a>
          </div>

        </div>
      </div>
    </>
  )
}
