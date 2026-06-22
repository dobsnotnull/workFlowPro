import React from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { Auth } from "./components/Auth";
import { ProfileSetup } from "./components/ProfileSetup";
import { ManagerDashboard } from "./components/ManagerDashboard";
import { StaffDashboard } from "./components/StaffDashboard";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";

const MainAppContent: React.FC = () => {
  const { user, profile, loading, logout } = useAuth();

  // Loading indicator matching Vercel's minimal speed aesthetics
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center">
          {/* Black rotating spinner */}
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 512 512">
              <path d="M256 32L480 432H32L256 32Z" />
            </svg>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-neutral-600 mb-2" />
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest animate-pulse">Loading Workspace Module</p>
        </div>
      </div>
    );
  }

  // Not authenticated? Show the Authentication login/register pages
  if (!user) {
    return <Auth />;
  }

  // Handle case where authentication finishes but Firestore profile fetch is missing/incomplete
  if (!profile) {
    return <ProfileSetup />;
  }

  // Role-Based Access Routing Protection
  if (profile.role === "Manager") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <ManagerDashboard />
      </motion.div>
    );
  }

  if (profile.role === "Staff") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <StaffDashboard />
      </motion.div>
    );
  }

  // Fallback fallback error panel
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="max-w-md bg-white border border-[#eaeaea] p-6 rounded-xl text-center shadow-sm">
        <h2 className="text-sm font-bold text-red-600">Workspace Routing Error</h2>
        <p className="text-xs text-gray-500 mt-1">Your profile exists but is marked with an invalid routing classification: "{profile.role}". Contact your database administrator.</p>
        <button 
          onClick={logout} 
          className="mt-4 inline-block bg-black text-white hover:bg-neutral-800 text-xs py-1.5 px-4 rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
