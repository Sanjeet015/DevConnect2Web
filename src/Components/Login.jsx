import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { HiOutlineCodeBracket } from "react-icons/hi2";
import { FiMail, FiLock, FiUser, FiArrowRight } from "react-icons/fi";
import toast from "react-hot-toast";

const Login = () => {
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
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
      toast.success("Account created successfully!");
      dispatch(addUser(res.data?.data || res.data));
      navigate("/setting");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Left Pane: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden select-none">
        {/* Glow Effects */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-[#0091ff]/10 rounded-full blur-[120px]" />

        {/* Top brand */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <HiOutlineCodeBracket size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight">
            Dev<span className="text-blue-500">Connect</span>
          </span>
        </div>

        {/* Center illustration: Code workspace dashboard */}
        <div className="my-auto z-10 max-w-lg space-y-6">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Connect, Match, and Build with Developers.
          </h2>
          <p className="text-slate-400 text-base leading-relaxed font-medium">
            Join the developer ecosystem. Find matching project partners, collaborate on git repos, and build together.
          </p>

          {/* Simulated Interface card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-slate-500 text-[10px] ml-2 font-mono">devconnect --workspace</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <p className="text-slate-400">
                <span className="text-blue-400">const</span> developer = await DevConnect.<span className="text-emerald-400">findMatch</span>()
              </p>
              <p className="text-slate-500">// Result: Matched with Senior React Architect</p>
              <p className="text-slate-400">
                await developer.<span className="text-blue-400">inviteToGroup</span>(<span className="text-amber-400">"Wizards Space"</span>)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 font-semibold z-10">
          © {new Date().getFullYear()} DevConnect Inc. All rights reserved.
        </div>
      </div>

      {/* Right Pane: Login Form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Header Mobile Brand */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex lg:hidden justify-center items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <HiOutlineCodeBracket size={18} />
              </div>
              <span className="text-lg font-black text-slate-800">DevConnect</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">
              {isLogin ? "Sign in to workspace" : "Create developer account"}
            </h3>
            <p className="text-sm font-semibold text-slate-400">
              {isLogin ? "Enter credentials to access your console" : "Fill out inputs to configure your profile"}
            </p>
          </div>

          {/* Form wrapper */}
          <form
            onSubmit={isLogin ? handleLogin : handleSignUp}
            className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-5"
          >
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4 animate-scale-up">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition glow-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Last Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition glow-ring"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Work Email</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                  placeholder="jane.doe@devconnect.com"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition glow-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Console Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition glow-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <span>{loading ? "Processing..." : isLogin ? "Access Console" : "Create Account"}</span>
              {!loading && <FiArrowRight />}
            </button>
          </form>

          {/* Toggle view option */}
          <p className="text-center text-xs font-semibold text-slate-500 select-none">
            {isLogin ? "New to DevConnect?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 hover:text-blue-600 hover:underline cursor-pointer font-bold ml-1 transition"
            >
              {isLogin ? "Create Workspace" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;