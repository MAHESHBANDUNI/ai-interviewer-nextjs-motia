"use client"
import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { successToast, errorToast } from "@/app/components/ui/toast";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff , Mail} from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [animate, setAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // <-- added
  const searchParams = useSearchParams();

  useEffect(() => {
    setAnimate(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try{
     const result = await signIn("credentials", {
        email: email.trim(),
        password: password,
        redirect: false,
      });
    if(result.ok){
      successToast('Signed in successfully');
      const session = await getSession();
        if (session?.user?.role) {
          let path='';
          const callbackUrl = searchParams.get("callbackUrl");
          if(callbackUrl){
            path = callbackUrl.replace(process.env.NEXT_PUBLIC_BASE_URL, "");
          }
         
          if(callbackUrl){
            window.location.href = path;
          }
          else{
          switch (session?.user?.role) {
            case "admin":
              window.location.href = "/admin/dashboard";
              break;
            case "candidate":
              window.location.href = "/candidate/interviews";
              break;
            default:
              window.location.href = "/";
          }
          }
        } else {
          window.location.href = "/"; 
        }
    }
    if(!result.ok){
      console.error("Error: ",result.error);
      errorToast(result.error)
    }
    }
    catch(err){
      console.error("Error: ",err);
      errorToast('Kindly verify your crendentials.')
    }
    finally{
      setIsSubmitting(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <>
      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          0% {opacity: 0;}
          100% {opacity: 1;}
        }
        .animateFadeIn {
          animation: fadeIn 0.5s ease-in forwards;
        }
      `}</style>

      <div className={`flex min-h-screen items-center justify-center bg-linear-to-br from-blue-100 via-white to-blue-200`}>
        <div
          className={`w-full max-w-md rounded-xl shadow-lg bg-white p-8 transform transition-all duration-700 ease-out
            ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-800">Sign in to AI Interviewer</h2>
          <form className="space-y-6" onSubmit={(e)=>handleSubmit(e)}>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out
                  focus:shadow-lg pr-10"
                placeholder="you@example.com"
                required
              />
              <span 
                className="absolute right-3 top-2 cursor-pointer text-gray-500"
              >
                <Mail className='w-5 h-5 text-gray-500'/>
                </span>
                </div>
            </div>

            {/* Password + Eye Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none transition-shadow duration-300 ease-in-out
                    focus:shadow-lg pr-10"
                  placeholder="••••••••"
                  required
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-2 cursor-pointer text-gray-500"
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5 text-gray-500" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  )}
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm opacity-0 animateFadeIn">{error}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="cursor-pointer w-full py-2 px-4 rounded-sm bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300 flex justify-center items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
