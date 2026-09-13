"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-white dark:bg-neutral-950 flex flex-col items-center justify-center">
      {/* Grid background */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />
      {/* Dark mode grid */}
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Top-left Copper/Teal/Blue Slime Glow */}
      <motion.div 
        className="absolute -top-[150px] -left-[150px] w-[500px] h-[500px] pointer-events-none z-0 bg-gradient-to-br from-teal-400/60 via-cyan-500/50 to-orange-400/50 dark:from-teal-400/40 dark:via-cyan-500/30 dark:to-orange-400/30"
        animate={{
          rotate: [360, 270, 180, 90, 0],
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "20% 80% 50% 50% / 40% 50% 60% 50%",
            "80% 20% 70% 30% / 30% 80% 40% 70%",
            "60% 40% 30% 70% / 60% 30% 70% 40%"
          ],
          scaleX: [0.8, 1.3, 0.7, 1],
          scaleY: [1, 0.7, 1.3, 0.8],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          filter: "blur(50px)",
        }}
      />

      {/* Floating Slime Fragments */}
      <motion.div 
        className="absolute top-[10%] left-[20%] w-[200px] h-[200px] pointer-events-none z-0 bg-acadly-violet/40 dark:bg-acadly-violet/50"
        animate={{
          x: [0, 300, -100, 0],
          y: [0, 150, 200, 0],
          rotate: [0, 180, 360],
          borderRadius: [
            "30% 70% 70% 30% / 30% 30% 70% 70%",
            "50% 50% 30% 70% / 50% 50% 70% 50%",
            "30% 70% 70% 30% / 30% 30% 70% 70%"
          ],
          scaleX: [0.5, 0.9, 0.4, 0.6],
          scaleY: [0.8, 0.4, 0.9, 0.5],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(40px)" }}
      />
      
      <motion.div 
        className="absolute top-[30%] left-[60%] w-[250px] h-[250px] pointer-events-none z-0 bg-gradient-to-br from-teal-400/50 to-cyan-500/50 dark:from-teal-400/30 dark:to-cyan-500/30"
        animate={{
          x: [0, -400, 100, 0],
          y: [0, -200, 100, 0],
          rotate: [360, 180, 0],
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 70% 50% 50% / 30% 60% 40% 70%",
            "60% 40% 30% 70% / 60% 30% 70% 40%"
          ],
          scaleX: [0.6, 1.1, 0.4, 0.7],
          scaleY: [0.9, 0.5, 1.2, 0.6],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(45px)" }}
      />

      <motion.div 
        className="absolute top-[40%] left-[30%] w-[150px] h-[150px] pointer-events-none z-0 bg-orange-400/50 dark:bg-orange-400/30"
        animate={{
          x: [0, 200, -200, 0],
          y: [0, -100, -300, 0],
          rotate: [0, 360],
          scaleX: [0.4, 0.9, 0.3, 0.5],
          scaleY: [0.7, 0.3, 0.8, 0.4],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(30px)" }}
      />

      {/* Nav */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6"
      >
        <span className="font-display text-xl font-semibold text-black dark:text-white">Acadly</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => setShowLogin(true)} className="text-sm font-medium hover:text-acadly-violet text-black dark:text-white transition-colors">Log in</button>
        </div>
      </motion.div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl mx-auto w-full h-screen">
        {/* Animated Antigravity-style Slime Glow */}
        <motion.div 
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] pointer-events-none -z-10 bg-acadly-violet/40 dark:bg-acadly-violet/50"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            borderRadius: [
              "40% 60% 70% 30% / 40% 50% 60% 50%",
              "20% 80% 30% 70% / 60% 30% 70% 40%",
              "80% 20% 50% 50% / 30% 80% 20% 70%",
              "40% 60% 70% 30% / 40% 50% 60% 50%"
            ],
            scaleX: [1, 1.2, 0.8, 1.1, 1],
            scaleY: [1, 0.8, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: "blur(50px)",
          }}
        />
        
        <motion.div
          animate={{ 
            x: showLogin ? 150 : 0, 
            opacity: showLogin ? 0 : 1, 
            filter: showLogin ? "blur(20px)" : "blur(0px)" 
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="flex flex-col items-center w-full h-full"
          style={{ pointerEvents: showLogin ? "none" : "auto" }}
        >
          {/* Top spacer to push text exactly to the vertical center */}
          <div className="flex-1" />

          {/* Perfectly centered text block */}
          <div className="flex-none flex flex-col items-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 tracking-tighter text-black dark:text-white text-center"
            >
              Acadly Workspace
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              className="text-lg text-black/60 dark:text-white/60 max-w-xl text-center"
            >
              One workspace for every committee. Calendar, tasks, submissions, and approvals — all in one place.
            </motion.p>
          </div>
          
          {/* Bottom spacer containing the button, pushed down */}
          <div className="flex-1 flex flex-col items-center justify-start pt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              className="flex flex-col items-center justify-center gap-6 cursor-pointer group outline-none"
              onClick={() => setShowLogin(true)}
            >
              {/* Perfect Circle with Arrow */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center justify-center w-24 h-24 rounded-full border border-black/10 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-colors duration-300 group-hover:bg-white/30 dark:group-hover:bg-white/10 outline-none"
              >
                {/* Top-Right Arrow SVG */}
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-black dark:text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <path d="M5 19L17 7M17 7H7M17 7V17" />
                </svg>
                
                {/* Water Ripple on Click */}
                <motion.div
                  className="absolute inset-0 rounded-full border-[2px] border-black/20 dark:border-white/20 pointer-events-none"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={showLogin ? { scale: 1.6, opacity: [1, 0] } : {}}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </motion.div>

              {/* External Text */}
              <span className="text-base font-normal text-black/80 dark:text-white/80 leading-snug text-center transition-colors duration-300 group-hover:text-black dark:group-hover:text-white">
                Get<br/>started
              </span>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showLogin && (
            <motion.div
              initial={{ x: "0%", y: "-50%", opacity: 0, filter: "blur(20px)" }}
              animate={{ x: "-50%", y: "-50%", opacity: 1, filter: "blur(0px)" }}
              exit={{ x: "0%", y: "-50%", opacity: 0, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="absolute top-1/2 left-1/2 w-full max-w-md p-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl shadow-2xl flex flex-col gap-6"
            >
              <h2 className="text-3xl font-bold tracking-tight text-black dark:text-white">
                {authMode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {authMode === "register" && (
                    <motion.input 
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      placeholder="Full name" 
                      className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 text-black dark:text-white outline-none focus:border-acadly-violet transition-colors" 
                    />
                  )}
                </AnimatePresence>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address" 
                  className="w-full px-5 py-4 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 text-black dark:text-white outline-none focus:border-acadly-violet transition-colors" 
                />
                
                <div className="relative w-full">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full px-5 py-4 pr-12 rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 text-black dark:text-white outline-none focus:border-acadly-violet transition-colors" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full mt-2 py-4 rounded-xl bg-acadly-violet text-white font-semibold shadow-md hover:bg-acadly-violet/90 transition-colors"
                >
                  {loading ? "Logging in..." : authMode === "login" ? "Log in" : "Create account"}
                </button>
                <div className="mt-4 flex items-center justify-between text-sm text-black/50 dark:text-white/50">
                  <button onClick={() => { setShowLogin(false); setTimeout(() => setAuthMode("login"), 500); }} className="hover:text-black dark:hover:text-white transition-colors">← Back</button>
                  <button 
                    onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} 
                    className="hover:text-black dark:hover:text-white transition-colors"
                  >
                    {authMode === "login" ? "Create account" : "Log in instead"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
