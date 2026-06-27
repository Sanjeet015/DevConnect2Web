import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { HiOutlineCodeBracket } from "react-icons/hi2";
import { FiMail, FiLock, FiUser, FiArrowRight, FiCheckCircle, FiShield, FiLock as FiKey } from "react-icons/fi";
import toast from "react-hot-toast";

const Login = () => {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("login"); 
  const [pinCode, setPinCode] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailId || !password) return toast.error("All fields are required");
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/login`,
        { emailId, password },
        { withCredentials: true }
      );
      toast.success("Welcome back to DevConnect!");
      dispatch(addUser(res.data?.data || res.data));
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !emailId || !password) {
      return toast.error("All fields are required");
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${BASE_URL}/signup`,
        { firstName, lastName, emailId, password },
        { withCredentials: true }
      );
      toast.success("Account created! Let's verify your email.");
      dispatch(addUser(res.data?.data || res.data));
      setView("verify");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMockForgotSubmit = (e) => {
    e.preventDefault();
    if (!emailId) return toast.error("Please enter your email");
    toast.success(`Verification password reset link dispatched to ${emailId}`);
    setView("login");
  };

  const handleMockVerifySubmit = (e) => {
    e.preventDefault();
    if (pinCode.length < 4) return toast.error("Please enter a valid verification pin");
    toast.success("Email verified successfully! Welcome to DevConnect.");
    navigate("/setting");
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 font-sans transition-colors">
      <div className="hidden lg:flex w-1/2 bg-slate-900 dark:bg-zinc-900 text-white flex-col justify-between p-12 relative overflow-hidden select-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[120px]" />

        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <HiOutlineCodeBracket size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight">
            Dev<span className="text-indigo-500">Connect</span>
          </span>
        </div>

        <div className="my-auto z-10 max-w-lg space-y-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Connect, Match, and Build with Developers.
          </h2>
          <p className="text-slate-400 dark:text-zinc-400 text-base leading-relaxed font-medium">
            Join the developer ecosystem. Find matching project partners, collaborate on git repos, and build together.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-slate-500 text-[10px] ml-2 font-mono">devconnect --workspace</span>
            </div>
            <div className="space-y-2 font-mono text-xs text-slate-300">
              <p>
                <span className="text-indigo-400">const</span> developer = <span className="text-blue-400">await</span> DevConnect.<span className="text-emerald-400">findMatch</span>()
              </p>
              <p className="text-slate-500 dark:text-zinc-500">
                Result: Matched with Senior React Architect
              </p>
              <p>
                <span className="text-blue-400">await</span> developer.<span className="text-indigo-400">inviteToGroup</span>(<span className="text-amber-400">"Wizards Space"</span>)
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold z-10">
          © {new Date().getFullYear()} DevConnect Inc. All rights reserved.
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          
          <div className="text-center lg:text-left space-y-2">
            <div className="flex lg:hidden justify-center items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <HiOutlineCodeBracket size={18} />
              </div>
              <span className="text-lg font-black text-slate-800 dark:text-zinc-100">DevConnect</span>
            </div>
            
            <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-100 tracking-tight">
              {view === "login" && "Sign in to workspace"}
              {view === "signup" && "Create developer account"}
              {view === "forgot" && "Reset your password"}
              {view === "verify" && "Verify your email"}
            </h3>
            <p className="text-sm font-semibold text-slate-400 dark:text-zinc-400">
              {view === "login" && "Enter credentials to access your console"}
              {view === "signup" && "Fill out inputs to configure your profile"}
              {view === "forgot" && "We'll send recovery credentials to your inbox"}
              {view === "verify" && "Enter the verification pin code we sent you"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none space-y-5">
            
            {view === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">Work Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input
                      type="email"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      placeholder="jane.doe@devconnect.com"
                      required
                      className="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase">Console Password</label>
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-50/50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Processing..." : "Access Console"}</span>
                  {!loading && <FiArrowRight />}
                </button>
              </form>
            )}

            {view === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">First Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        required
                        className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">Last Name</label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">Work Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input
                      type="email"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      placeholder="jane.doe@devconnect.com"
                      required
                      className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 dark:disabled:bg-zinc-800 disabled:cursor-not-allowed"
                >
                  <span>{loading ? "Creating..." : "Create Account"}</span>
                  {!loading && <FiArrowRight />}
                </button>
              </form>
            )}

            {view === "forgot" && (
              <form onSubmit={handleMockForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-1.5">Work Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-3.5 text-slate-400" size={14} />
                    <input
                      type="email"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      placeholder="jane.doe@devconnect.com"
                      required
                      className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all glow-ring text-slate-800 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiKey size={16} />
                  <span>Send Recovery Link</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="w-full text-center text-xs font-bold text-slate-555 dark:text-zinc-400 hover:underline cursor-pointer block pt-2"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {view === "verify" && (
              <form onSubmit={handleMockVerifySubmit} className="space-y-5">
                <div className="text-center py-2">
                  <FiShield className="mx-auto text-indigo-500" size={44} />
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 max-w-[280px] mx-auto">
                    We sent a simulated 6-digit confirmation pin to your inbox.
                  </p>
                </div>
                
                <div>
                  <label className="block text-center text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase mb-2">Confirmation Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full bg-slate-50/50 dark:bg-zinc-955 border border-slate-200 dark:border-zinc-800 rounded-xl py-3.5 text-center text-lg tracking-[0.5em] font-black outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-955 transition-all text-slate-800 dark:text-zinc-100"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiCheckCircle size={16} />
                  <span>Confirm Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => toast.success("Simulated Code Re-sent!")}
                  className="w-full text-center text-xs font-bold text-slate-555 dark:text-zinc-400 hover:underline cursor-pointer block"
                >
                  Resend Code
                </button>
              </form>
            )}
          </div>

          {(view === "login" || view === "signup") && (
            <p className="text-center text-xs font-semibold text-slate-500 select-none">
              {view === "login" ? "New to DevConnect?" : "Already have an account?"}{" "}
              <button
                onClick={() => setView(view === "login" ? "signup" : "login")}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer font-bold ml-1 transition"
              >
                {view === "login" ? "Create Workspace" : "Log in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;