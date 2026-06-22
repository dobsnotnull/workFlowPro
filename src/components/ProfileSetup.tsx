import React, { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { UserRole } from "../types";
import { motion } from "motion/react";
import { Shield, Briefcase, User, Loader2, LogOut } from "lucide-react";

export const ProfileSetup: React.FC = () => {
  const { user, completeProfile, logout } = useAuth();
  const [name, setName] = useState(user?.displayName || "");
  const [role, setRole] = useState<UserRole>("Staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Please enter your full name to configure your workspace");
      }
      await completeProfile(name.trim(), role);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while creating your profile.");
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
        id="profile-setup-container"
      >
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
            Complete Workspace Profile
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 text-center">
            You've signed in successfully. Now set your workspace name and role to proceed.
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs flex items-center gap-2"
            id="setup-error-toast"
          >
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6" id="profile-setup-form">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="setup-full-name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="setup-full-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#eaeaea] rounded-md placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Workspace Role
            </label>
            <div className="grid grid-cols-2 gap-3" id="setup-role-selector">
              <button
                type="button"
                id="setup-role-staff-button"
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
                id="setup-role-manager-button"
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

          <button
            type="submit"
            id="setup-submit-btn"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 font-medium text-sm py-2 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              "Initialize Profile"
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-[#eaeaea] flex justify-center">
          <button
            type="button"
            id="setup-cancel-btn"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-black hover:underline focus:outline-none font-medium font-mono uppercase tracking-wider"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cancel & Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};
