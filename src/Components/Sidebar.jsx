import React, { useEffect, useRef, useState } from "react";
import {
  FiCompass,
  FiUserPlus,
  FiUsers,
  FiMessageSquare,
  FiUser,
  FiSettings,
} from "react-icons/fi";
import { RiGroupLine } from "react-icons/ri";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { BASE_URL } from "../utils/constants";
import { useSelector } from "react-redux";

function Sidebar() {
  const location = useLocation();
  const currentUser = useSelector((store) => store.user);

  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    
    const fetchInitialCounts = async () => {
      try {
        const [reqsRes, chatsRes] = await Promise.all([
          axios.get(`${BASE_URL}/user/request/received`, { withCredentials: true }),
          axios.get(`${BASE_URL}/chat/conversations`, { withCredentials: true }),
        ]);
        setPendingRequestsCount(reqsRes.data?.data?.length || 0);
        setUnreadMessagesCount(chatsRes.data?.totalUnreadMessages || 0);
      } catch (err) {
        console.error("Error fetching initial badge counts:", err.message);
      }
    };

    fetchInitialCounts();

    
    const socketUrl = BASE_URL.replace("/api", "");
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("receive_message", () => {
      if (!window.location.pathname.startsWith("/messages")) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    });

    socket.on("new_connection_request", () => {
      setPendingRequestsCount((prev) => prev + 1);
    });

    socket.on("new_match", () => {
      setUnreadMessagesCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (location.pathname === "/messages") {
      setUnreadMessagesCount(0);
    }
    if (location.pathname === "/requests") {
      setPendingRequestsCount(0);
    }
  }, [location.pathname]);

  const navItems = [
    { path: "/", label: "Feed", icon: <FiCompass /> },
    { path: "/requests", label: "Requests", icon: <FiUserPlus />, count: pendingRequestsCount },
    { path: "/connections", label: "Connections", icon: <FiUsers /> },
    { path: "/messages", label: "Messages", icon: <FiMessageSquare />, count: unreadMessagesCount },
    { path: "/groups", label: "Groups", icon: <RiGroupLine /> },
    { path: "/profile", label: "Profile", icon: <FiUser /> },
    { path: "/setting", label: "Settings", icon: <FiSettings /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 flex-col gap-1.5 p-4 z-30 select-none transition-colors">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
          Developer Menu
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100/40 dark:border-indigo-900/30"
                    : "text-slate-650 dark:text-zinc-450 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`text-lg transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-bold">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${
                    isActive ? "bg-indigo-600 dark:bg-indigo-500 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                  }`}>
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation (Apple-style Tab Bar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800/80 flex justify-around items-center pt-2.5 pb-4 px-2 z-40 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.04)] transition-colors">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center relative transition-transform active:scale-90">
              <span className={`text-xl transition-colors duration-150 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500 hover:text-slate-650"}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] mt-1 font-bold tracking-tight transition-colors duration-150 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500"}`}>
                {item.label}
              </span>

              {/* Status Circle under active tab */}
              {isActive && (
                <span className="w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full absolute -bottom-1"></span>
              )}

              {}
              {item.count > 0 && (
                <span className="absolute -top-1 right-3.5 bg-indigo-600 dark:bg-indigo-500 text-white text-[8px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-zinc-950 shadow-xs">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}

export default Sidebar;