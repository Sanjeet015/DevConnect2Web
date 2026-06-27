import React, { useState } from "react";
import { FiBell, FiLogOut, FiUser, FiSettings, FiSearch, FiSun, FiMoon } from "react-icons/fi";
import { HiOutlineCodeBracket } from "react-icons/hi2";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";

export default function Navbar() {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      const isDark = stored === "true";
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return isDark;
    }
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (systemDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    return systemDark;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BASE_URL}/logout`, {}, { withCredentials: true });
      dispatch(removeUser());
      setDropdownOpen(false);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-colors">
      
      {}
      {user ? (
        <Link to={"/"}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center">
              <HiOutlineCodeBracket size={18} />
            </div>

            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-zinc-100">
              Dev<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
            </h1>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2" title="Log in to go home">
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center opacity-60">
            <HiOutlineCodeBracket size={18} />
          </div>

          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-zinc-100 opacity-60">
            Dev<span className="text-indigo-600 dark:text-indigo-400">Connect</span>
          </h1>
        </div>
      )}

      {/* Search Bar */}
      {user && (
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[160px] xs:max-w-[240px] sm:max-w-xs md:max-w-md mx-2 sm:mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search stack, names..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
              }}
              className="w-full bg-[#f8fafc] dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition-all text-slate-700 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={13} />
          </div>
        </form>
      )}

      {}
      <div className="flex items-center gap-2 md:gap-4">
        
        {}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        {/* Profile Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 cursor-pointer focus:outline-none select-none"
            >
              <img
                src={user.photoUrl}
                alt="Profile"
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-slate-200/80 dark:border-zinc-800 shadow-xs"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/40 px-1.5 py-0.5 rounded-md mt-0.5 inline-block uppercase tracking-wider">
                  Developer
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setDropdownOpen(false)}
                />
                
                <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-40 animate-scale-up">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate mt-1">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.emailId}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                  >
                    <FiUser className="text-slate-400 dark:text-zinc-500" size={14} />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link
                    to="/setting"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
                  >
                    <FiSettings className="text-slate-400 dark:text-zinc-500" size={14} />
                    <span>Settings Dashboard</span>
                  </Link>

                  <hr className="border-slate-100 dark:border-zinc-800 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition text-left cursor-pointer"
                  >
                    <FiLogOut className="text-rose-400 dark:text-rose-500" size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}