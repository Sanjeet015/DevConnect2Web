import React, { useState } from "react";
import { FiBell, FiLogOut, FiUser, FiSettings } from "react-icons/fi";
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
    <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* Logo */}
      {user ? (
        <Link to={"/"}>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <HiOutlineCodeBracket size={18} />
            </div>

            <h1 className="text-lg md:text-xl font-bold text-gray-800">
              Dev<span className="text-blue-600">Connect</span>
            </h1>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-2" title="Log in to go home">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center opacity-60">
            <HiOutlineCodeBracket size={18} />
          </div>

          <h1 className="text-lg md:text-xl font-bold text-gray-800 opacity-60">
            Dev<span className="text-blue-600">Connect</span>
          </h1>
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3 md:gap-6">
        
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
                className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-slate-200/80 shadow-xs"
              />
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100/40 px-1.5 py-0.5 rounded-md mt-0.5 inline-block uppercase tracking-wider">
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
                
                <div className="absolute right-0 mt-2.5 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-40 animate-scale-up">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account</p>
                    <p className="text-sm font-bold text-slate-800 truncate mt-1">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.emailId}</p>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FiUser className="text-slate-400" size={14} />
                    <span>My Profile</span>
                  </Link>
                  
                  <Link
                    to="/setting"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FiSettings className="text-slate-400" size={14} />
                    <span>Settings Dashboard</span>
                  </Link>

                  <hr className="border-slate-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                  >
                    <FiLogOut className="text-rose-400" size={14} />
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