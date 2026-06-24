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

  // Fix #8: Replace 12s polling with a Socket.IO connection listening for real-time events.
  // Initial counts are fetched once on mount; from then on, only updated via socket events.
  useEffect(() => {
    if (!currentUser) return;

    // Fetch initial badge counts once (no polling interval)
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

    // Connect to Socket.IO to listen for real-time badge updates
    const socketUrl = BASE_URL.replace("/api", "");
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Increment unread messages badge when a message arrives in any chat
    socket.on("receive_message", () => {
      // Only increment if the user is NOT currently on the messages page
      if (!window.location.pathname.startsWith("/messages")) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
    });

    // Increment badge when a new connection request is received
    socket.on("new_connection_request", () => {
      setPendingRequestsCount((prev) => prev + 1);
    });

    // A new match happened — a message from matched user will increment badge
    socket.on("new_match", () => {
      setUnreadMessagesCount((prev) => prev + 1);
    });

    // When user navigates to messages, clear the unread messages badge
    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Reset unread messages badge when user visits the messages page
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
      <aside className="hidden md:flex fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-slate-200/80 bg-white flex-col gap-1.5 p-4 z-30 select-none">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Developer Menu
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}>
              <div
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#0091ff]/8 text-[#0091ff] font-bold border border-blue-100/40"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
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
                    isActive ? "bg-[#0091ff] text-white" : "bg-[#edf2f7] text-slate-600"
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex justify-around items-center pt-2.5 pb-4 px-2 z-40 select-none shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex-1 flex flex-col items-center relative transition-transform active:scale-90">
              <span className={`text-xl transition-colors duration-150 ${isActive ? "text-[#0091ff]" : "text-slate-400 hover:text-slate-600"}`}>
                {item.icon}
              </span>
              <span className={`text-[9px] mt-1 font-bold tracking-tight transition-colors duration-150 ${isActive ? "text-[#0091ff]" : "text-slate-400"}`}>
                {item.label}
              </span>

              {/* Status Circle under active tab */}
              {isActive && (
                <span className="w-1 h-1 bg-[#0091ff] rounded-full absolute -bottom-1"></span>
              )}

              {/* Notification badge bubble on mobile */}
              {item.count > 0 && (
                <span className="absolute -top-1 right-3.5 bg-[#0091ff] text-white text-[8px] font-extrabold w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-xs">
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