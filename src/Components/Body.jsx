import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import { Outlet, useNavigate } from "react-router-dom";
import Footer from "./Footer";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "../utils/userSlice";
import axios from "axios";
import Sidebar from "./Sidebar";

function Body() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  // Fix #15: Show a full-screen spinner while the session is being verified on mount
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await axios.get(BASE_URL + "/profile/view", {
        withCredentials: true,
      });
      dispatch(addUser(res.data));
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        console.error(err);
      }
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    if (!user) {
      fetchUser();
    } else {
      setIsBootstrapping(false);
    }
  }, []);

  // Full-screen loading state while verifying auth session
  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[3px] border-slate-200 border-t-[#0091ff] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        {user && <Sidebar />}

        <main
          className={`flex-1 flex flex-col min-h-[calc(100vh-4rem)] ${
            user ? "md:ml-64" : ""
          }`}
        >
          <div className="flex-1 pb-16 md:pb-0">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

export default Body;