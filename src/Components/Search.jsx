import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import axios from "axios";
import toast from "react-hot-toast";
import { FiSearch, FiMessageSquare, FiUserPlus, FiCheck, FiX, FiInfo } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Profile from "./Profile"; 

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChat, setStartingChat] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchResults = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/user/search?q=${query}`, {
        withCredentials: true,
      });
      setResults(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to search developers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query]);

  const handleStartChat = async (userId) => {
    try {
      setStartingChat((prev) => ({ ...prev, [userId]: true }));
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
      setStartingChat((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleReviewRequest = async (status, requestId, userId) => {
    try {
      await axios.post(
        `${BASE_URL}/request/review/${status}/${requestId}`,
        {},
        { withCredentials: true }
      );
      setResults((prev) =>
        prev.map((u) =>
          u._id === userId
            ? { ...u, connectionStatus: status === "Accepted" ? "Connected" : "Rejected" }
            : u
        )
      );
      toast.success(status === "Accepted" ? "Request accepted!" : "Request ignored.");
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  const handleSendRequest = async (status, userId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/request/send/${status}/${userId}`,
        {},
        { withCredentials: true }
      );
      const newRequest = res.data?.data;
      setResults((prev) =>
        prev.map((u) =>
          u._id === userId
            ? {
                ...u,
                connectionStatus: status === "Interested" ? "RequestSent" : "Ignored",
                requestId: newRequest?._id || u.requestId,
              }
            : u
        )
      );
      toast.success(status === "Interested" ? "Connection request sent!" : "User ignored.");
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#091e42] flex items-center gap-3">
          <FiSearch size={28} className="text-[#0091ff]" />
          Search Results
        </h2>
        <p className="text-[#62718b] font-medium mt-1">
          {query.trim()
            ? `Found ${results.length} developer${results.length === 1 ? "" : "s"} for "${query}"`
            : "Enter a search term in the navigation bar to search developers."}
        </p>
      </div>

      {loading ? (
        <div className="w-full text-center py-20">
          <span className="loading loading-spinner text-[#0091ff] loading-lg"></span>
          <p className="text-[#62718b] text-sm font-medium mt-4">Searching database...</p>
        </div>
      ) : !query.trim() ? (
        <div className="w-full text-center py-20 bg-white border border-[#edf2f7] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-8">
          <div className="w-16 h-16 bg-blue-50 text-[#0091ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiSearch size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Search DevConnect</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
            Find developers by their first name, last name, or key tech skills (e.g. React, Node, Python).
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="w-full text-center py-20 bg-white border border-[#edf2f7] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] p-8">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiSearch size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No results found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto leading-relaxed">
            We couldn't find any developers matching "{query}". Try checking the spelling or searching for another keyword.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((dev) => (
            <div
              key={dev._id}
              className="bg-white border border-[#edf2f7] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-4 mb-5">
                  <img
                    src={dev.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={`${dev.firstName} ${dev.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-[#091e42] truncate">
                      {dev.firstName} {dev.lastName}
                    </h3>
                    <p className="text-xs text-[#62718b] font-medium truncate mt-0.5">
                      {dev.about || `${dev.age || "N/A"} years old • ${dev.gender || "Developer"}`}
                    </p>
                  </div>
                </div>

                {}
                <div className="mb-4">
                  {dev.connectionStatus === "Connected" && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                      <FiCheck size={12} /> Connected
                    </span>
                  )}
                  {dev.connectionStatus === "RequestSent" && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full border border-amber-100 animate-pulse">
                      Pending Request (Sent)
                    </span>
                  )}
                  {dev.connectionStatus === "RequestReceived" && (
                    <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0091ff] text-xs font-bold px-3 py-1 rounded-full border border-blue-100 animate-pulse">
                      Pending Request (Received)
                    </span>
                  )}
                  {dev.connectionStatus === "Ignored" && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                      Ignored
                    </span>
                  )}
                  {dev.connectionStatus === "Rejected" && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                      Rejected
                    </span>
                  )}
                  {dev.connectionStatus === "None" && (
                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
                      Not Connected
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dev.skills?.length > 0 ? (
                    dev.skills.map((skill, index) => (
                      <span key={index} className="bg-[#edf2f7] text-[#4a5568] text-[10px] font-bold px-2.5 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {}
              <div className="flex items-center gap-3 mt-auto">
                <button
                  onClick={() => {
                    setSelectedUser(dev);
                    setShowViewModal(true);
                  }}
                  className="flex-1 py-2.5 px-3 bg-[#f8fafc] border border-[#e2e8f0] text-xs font-bold text-[#2d3748] rounded-xl hover:bg-[#edf2f7] transition"
                >
                  View
                </button>

                {dev.connectionStatus === "Connected" && (
                  <button
                    onClick={() => handleStartChat(dev._id)}
                    disabled={startingChat[dev._id]}
                    className="flex-[2] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0091ff] hover:bg-[#007be6] disabled:bg-[#0091ff]/60 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    <FiMessageSquare size={14} />
                    {startingChat[dev._id] ? "Connecting..." : "Chat"}
                  </button>
                )}

                {dev.connectionStatus === "RequestReceived" && (
                  <div className="flex-[2] flex items-center gap-2">
                    <button
                      onClick={() => handleReviewRequest("Rejected", dev.requestId, dev._id)}
                      className="p-2.5 border border-[#e2e8f0] hover:bg-rose-50 text-rose-500 rounded-xl transition"
                      title="Ignore Request"
                    >
                      <FiX size={16} />
                    </button>
                    <button
                      onClick={() => handleReviewRequest("Accepted", dev.requestId, dev._id)}
                      className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <FiCheck size={14} /> Accept
                    </button>
                  </div>
                )}

                {(dev.connectionStatus === "None" || dev.connectionStatus === "Ignored" || dev.connectionStatus === "Rejected") && (
                  <div className="flex-[2] flex items-center gap-2">
                    <button
                      onClick={() => handleSendRequest("Ignored", dev._id)}
                      className="p-2.5 border border-[#e2e8f0] hover:bg-[#f8fafc] text-slate-500 rounded-xl transition"
                      title="Ignore"
                    >
                      <FiX size={16} />
                    </button>
                    <button
                      onClick={() => handleSendRequest("Interested", dev._id)}
                      className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <FaHeart size={10} className="text-rose-500" /> Interested
                    </button>
                  </div>
                )}

                {dev.connectionStatus === "RequestSent" && (
                  <button
                    disabled
                    className="flex-[2] py-2.5 px-4 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
                  >
                    Sent
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Profile Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="bg-white rounded-3xl w-full max-w-5xl my-auto p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 text-3xl font-light z-10"
            >
              &times;
            </button>
            <Profile viewedUser={selectedUser} isReadOnly={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
