import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "axios";
import { FiUserPlus } from "react-icons/fi";
import toast from "react-hot-toast";

const Requests = () => {
  const [requestList, setRequestList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch incoming connection requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(BASE_URL + "/user/request/received", {
        withCredentials: true,
      });
      setRequestList(res?.data?.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err.message);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  // Handle Accept or Review action status updates
  const handleReviewRequest = async (status, requestId) => {
    try {
      await axios.post(
        `${BASE_URL}/request/review/${status}/${requestId}`,
        {},
        { withCredentials: true }
      );
      setRequestList((prev) => prev.filter((req) => req._id !== requestId));
      toast.success(status === "Accepted" ? "Request accepted!" : "Request ignored.");
    } catch (err) {
      console.error(`Error updating request to ${status}:`, err.message);
      toast.error("Failed to update request");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8 bg-[#f8fafc] min-h-screen font-sans">
        <div className="mb-6">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-md mb-2"></div>
          <div className="h-4 w-24 bg-slate-200 animate-pulse rounded-md"></div>
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-[#edf2f7] rounded-[24px] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4 w-full">
                <div className="w-16 h-16 rounded-full bg-slate-200/80 animate-pulse flex-shrink-0"></div>
                <div className="space-y-2.5 w-full max-w-[300px]">
                  <div className="h-4 w-32 bg-slate-200/80 animate-pulse rounded-md"></div>
                  <div className="h-3 w-48 bg-slate-200/80 animate-pulse rounded-md"></div>
                  <div className="flex gap-1.5 pt-1.5">
                    <div className="h-5 w-12 bg-slate-100 animate-pulse rounded-md"></div>
                    <div className="h-5 w-16 bg-slate-100 animate-pulse rounded-md"></div>
                    <div className="h-5 w-14 bg-slate-100 animate-pulse rounded-md"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200/80 animate-pulse"></div>
                <div className="w-12 h-12 rounded-xl bg-slate-200/80 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (requestList.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="w-16 h-16 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
          <FiUserPlus size={24} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-[#091e42] tracking-tight">All caught up!</h3>
        <p className="text-[#62718b] text-sm mt-1.5 max-w-xs mx-auto">
          No pending connection requests. Browse the feed to discover other developers!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 bg-[#f8fafc] min-h-screen">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-[#091e42]">Connection requests</h2>
        <p className="text-[#62718b] font-medium mt-1">
          {requestList.length} pending
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {requestList.map((request) => {
          const user = request.fromUserId; 
          
          return (
            <div
              key={user._id}
              className="bg-white border border-[#edf2f7] rounded-[24px] p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
            >
              {/* Left Profile Section */}
              <div className="flex items-start md:items-center space-x-4">
                <img
                  src={user.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border border-slate-100 flex-shrink-0"
                />
                
                <div>
                  <h3 className="text-lg font-bold text-[#091e42] leading-tight">
                    {user.firstName} {user.lastName}
                  </h3>
                  
                  <p className="text-sm text-[#62718b] font-medium mt-0.5">
                    {user.about || `${user.age || "N/A"} years old`}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {user.skills && user.skills.slice(0, 5).map((skill, index) => (
                      <span
                        key={index}
                        className="bg-[#edf2f7] text-[#4a5568] text-[11px] font-semibold px-2.5 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:self-center self-end">
                <button
                  onClick={() => handleReviewRequest("Rejected", request._id)}
                  className="w-12 h-12 flex items-center justify-center border border-[#e2e8f0] hover:bg-[#f8fafc] text-[#091e42] rounded-xl shadow-sm transition-all active:scale-95"
                  aria-label="Reject request"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <button
                  onClick={() => handleReviewRequest("Accepted", request._id)}
                  className="w-12 h-12 flex items-center justify-center bg-[#0091ff] hover:bg-[#007be6] text-white rounded-xl shadow-md transition-all active:scale-95"
                  aria-label="Accept request"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Requests;