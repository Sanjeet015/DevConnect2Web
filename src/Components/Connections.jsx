import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Profile from "./Profile"; 
import { FiUsers, FiMessageSquare, FiTrash2, FiUser, FiSearch, FiSliders } from "react-icons/fi";

const Connections = () => {
  const navigate = useNavigate();
  const [connectionsList, setConnectionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null);

  const [removing, setRemoving] = useState(false);
  const [startingChat, setStartingChat] = useState({}); 

  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");

  const handleStartChat = async (userId) => {
    try {
      setStartingChat(prev => ({ ...prev, [userId]: true }));
      const res = await axios.post(`${BASE_URL}/chat/start/${userId}`, {}, { withCredentials: true });
      const chatId = res.data?.data?._id;
      if (chatId) {
        navigate("/messages", { state: { autoSelectChatId: chatId } });
      } else {
        toast.error("Could not start chat");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to start chat");
    } finally {
      setStartingChat(prev => ({ ...prev, [userId]: false }));
    }
  };

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/user/connection`, {
        withCredentials: true,
      });
      setConnectionsList(res?.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async () => {
    if (!selectedUser) return;
    try {
      setRemoving(true);
      await axios.delete(`${BASE_URL}/user/connection/${selectedUser._id}`, {
        withCredentials: true,
      });
      setConnectionsList((prev) =>
        prev.filter((user) => user._id !== selectedUser._id)
      );
      toast.success("Connection removed");
      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove connection");
    } finally {
      setRemoving(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  
  const filteredList = connectionsList.filter((dev) => {
    const fullName = `${dev.firstName} ${dev.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          (dev.about && dev.about.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkill = !selectedSkill || (dev.skills && dev.skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase()));
    return matchesSearch && matchesSkill;
  });

  
  const allSkills = Array.from(new Set(connectionsList.flatMap(dev => dev.skills || [])));

  if (loading) {
    return (
      <div className="w-full text-center py-20 bg-slate-50 dark:bg-zinc-950 min-h-screen">
        <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-lg"></span>
        <p className="text-slate-400 dark:text-zinc-500 text-sm font-semibold mt-4">Loading connections...</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-slate-50 dark:bg-zinc-950 min-h-screen transition-colors">
        
        {/* Header Title Block */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#091e42] dark:text-zinc-150 flex items-center gap-2">
              <FiUsers className="text-indigo-500" />
              Your Network
            </h2>
            <p className="text-[#62718b] dark:text-zinc-450 font-medium mt-1">
              {connectionsList.length} {connectionsList.length === 1 ? "developer" : "developers"} in your professional network
            </p>
          </div>
          
          {/* Quick Filters */}
          {connectionsList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-60">
                <input
                  type="text"
                  placeholder="Filter name or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-500"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              </div>

              {allSkills.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full sm:w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-700 dark:text-zinc-300 appearance-none cursor-pointer"
                  >
                    <option value="">All Skills</option>
                    {allSkills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                  <FiSliders className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                </div>
              )}
            </div>
          )}
        </div>

        {connectionsList.length === 0 ? (
          <div className="w-full text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-8 max-w-xl mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-zinc-800 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
              <FiUsers size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">Start Networking</h3>
            <p className="text-slate-550 dark:text-zinc-450 text-xs leading-relaxed max-w-xs mx-auto font-medium">
              You haven't formed any connections yet. Head back to the matches feed and swipe interested to start matchmaking!
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="w-full text-center py-16 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[32px] p-8 max-w-xl mx-auto font-semibold text-slate-450 dark:text-zinc-500 text-xs">
            No connections matched your current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((dev) => (
              <div
                key={dev._id}
                className="bg-white dark:bg-zinc-900 border border-[#edf2f7] dark:border-zinc-800 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)] hover:border-slate-300 dark:hover:border-zinc-700 transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center space-x-4 mb-5">
                    <img
                      src={dev.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={`${dev.firstName} ${dev.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border border-slate-100 dark:border-zinc-850"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-[#091e42] dark:text-zinc-200 truncate">
                        {dev.firstName} {dev.lastName}
                      </h3>
                      <p className="text-xs text-[#62718b] dark:text-zinc-400 font-medium truncate mt-0.5">
                        {dev.about || `${dev.age || "N/A"} years old • ${dev.gender || "Developer"}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {dev.skills?.length > 0 ? (
                      dev.skills.map((skill, index) => (
                        <span key={index} className="bg-[#edf2f7] dark:bg-zinc-850 text-[#4a5568] dark:text-zinc-300 text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No skills listed</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  <button 
                    onClick={() => {
                      setSelectedUser(dev);
                      setShowViewModal(true);
                    }}
                    className="flex-1 py-2.5 px-3 bg-[#f8fafc] dark:bg-zinc-950 border border-[#e2e8f0] dark:border-zinc-800 text-xs font-bold text-[#2d3748] dark:text-zinc-300 rounded-xl hover:bg-[#edf2f7] dark:hover:bg-zinc-800 transition"
                  >
                    View
                  </button>

                  <button 
                    onClick={() => handleStartChat(dev._id)}
                    disabled={startingChat[dev._id]}
                    className="flex-[1.8] flex items-center justify-center gap-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-[#0091ff]/60 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <FiMessageSquare size={13} />
                    {startingChat[dev._id] ? "Connecting..." : "Chat"}
                  </button>

                  <button
                    className="p-2.5 text-[#718096] hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 border border-slate-200 dark:border-zinc-800 rounded-xl transition cursor-pointer"
                    onClick={() => {
                      setSelectedUser(dev);
                      setShowModal(true);
                    }}
                    title="Remove Connection"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-5xl my-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 border dark:border-zinc-850">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-6 right-6 text-gray-400 dark:text-zinc-500 hover:text-gray-650 dark:hover:text-zinc-300 text-3xl font-light z-10 cursor-pointer"
            >
              &times;
            </button>
            <Profile viewedUser={selectedUser} isReadOnly={true} />
          </div>
        </div>
      )}

      {}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 w-[90%] max-w-md rounded-2xl p-6 shadow-2xl border dark:border-zinc-800 animate-scale-up">
            <h3 className="text-xl font-bold text-[#091e42] dark:text-zinc-200">Remove Connection</h3>
            <p className="text-[#62718b] dark:text-zinc-400 text-xs font-semibold leading-relaxed mt-3">
              Are you sure you want to remove{" "}
              <span className="font-extrabold text-[#091e42] dark:text-zinc-200">
                {selectedUser.firstName} {selectedUser.lastName}
              </span>{" "}
              from your connections list? This will remove chat privileges as well.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                disabled={removing}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-850 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConnection}
                disabled={removing}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition cursor-pointer"
              >
                {removing ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Connections;