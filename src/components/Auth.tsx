import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { UserRole } from "../types";
import { motion } from "motion/react";
import { Lock, Mail, User, Shield, Briefcase, Eye, EyeOff, Loader2 } from "lucide-react";

export const Auth: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Staff");
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthNotAllowed, setIsAuthNotAllowed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthNotAllowed(false);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        await register(email, password, name.trim(), role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let message = err.message || "An authentication error occurred.";
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        message = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        message = "This email address is already in use.";
      } else if (err.code === "auth/weak-password") {
        message = "Password must be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (err.code === "auth/operation-not-allowed") {
        message = "Email/Password sign-in option is not enabled in your Firebase project configuration.";
        setIsAuthNotAllowed(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsAuthNotAllowed(false);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-[#eaeaea] rounded-xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        id="auth-container"
      >
        {/* Vercel Triangle Logo Emblem */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-200">
            <svg 
              className="w-5 h-5 text-white fill-current" 
              viewBox="0 0 512 512"
            >
              <path d="M256 32L480 432H32L256 32Z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium tracking-tight text-gray-900">
            {isRegister ? "Join Organization" : "Sign in to Dashboard"}
          </h2>
          <p className="text-xs text-gray-400 mt-1.5">
            {isRegister ? "Create a workspace staff or manager profile" : "Enter your credentials to access active tasks"}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex flex-col gap-2"
            id="auth-error-toast"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
              <span className="font-semibold">Authentication Blocked</span>
            </div>
            <p className="leading-relaxed text-red-800">{error}</p>
            {isAuthNotAllowed && (
              <div className="mt-2 pt-2 border-t border-red-200/50 text-[11px] text-red-900 space-y-2 font-sans" id="autherror-steps">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-red-700 block">How to enable Email/Password login:</span>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Open the <a href="https://console.firebase.google.com/project/jaunty-affinity-86ppv/authentication/providers" target="_blank" rel="noopener noreferrer" className="underline font-medium text-blue-700 hover:text-blue-900">Firebase Console Auth Providers page</a>.</li>
                  <li>Click on <strong>Add new provider</strong> and choose <strong>Email/Password</strong>.</li>
                  <li>Toggle the <strong>Enable</strong> option and click <strong>Save</strong>.</li>
                  <li>Once done, refresh this page and you can sign in directly!</li>
                </ol>
                <div className="bg-white/60 p-2.5 rounded border border-red-200 text-[11px] font-medium mt-2">
                  💡 <strong>Tip:</strong> You can bypass this configuration entirely by using the <strong>Sign In with Google</strong> button below, which works instantly!
                </div>
              </div>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="full-name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="full-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="email-address">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="email-address"
                type="email"
                placeholder="you@organization.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="password-field">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password-field"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
              <button
                type="button"
                id="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Workspace Role
              </label>
              <div className="grid grid-cols-2 gap-3" id="role-selector">
                <button
                  type="button"
                  id="role-staff-button"
                  onClick={() => setRole("Staff")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-left transition-all ${
                    role === "Staff"
                      ? "border-black bg-black/5 font-medium text-black"
                      : "border-[#eaeaea] bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <Briefcase className="h-4 w-4 mb-1 text-inherit" />
                  <span className="text-xs">Staff Member</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Assigned Tasks Only</span>
                </button>
                
                <button
                  type="button"
                  id="role-manager-button"
                  onClick={() => setRole("Manager")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-left transition-all ${
                    role === "Manager"
                      ? "border-black bg-black/5 font-medium text-black"
                      : "border-[#eaeaea] bg-white text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <Shield className="h-4 w-4 mb-1 text-inherit" />
                  <span className="text-xs">Manager</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Full Workspace Control</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full mt-2 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 font-medium text-sm py-2 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : isRegister ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative my-6" id="auth-divider">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#eaeaea]"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-mono text-neutral-400">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          id="google-signin-btn"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full bg-white border border-[#eaeaea] hover:bg-neutral-50 hover:border-gray-300 text-gray-700 font-medium text-sm py-2 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google Workspace Account
        </button>

        <div className="mt-6 pt-5 border-t border-[#eaeaea] text-center">
          <button
            type="button"
            id="auth-switch-mode-btn"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-gray-500 hover:text-black hover:underline focus:outline-none"
          >
            {isRegister 
              ? "Already have an account? Sign in" 
              : "Don't have an account? Sign up with role"
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
};
