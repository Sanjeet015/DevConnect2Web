import React, { useEffect, useState } from 'react';
import { BASE_URL } from '../utils/constants';
import axios from 'axios';

const Connections = () => {
  // 1. Initialize local state to store the connections array
  const [connectionsList, setConnectionsList] = useState([]);

  const fetchConnection = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/connection", {
        withCredentials: true,
      });
      // 2. Save the array from API into state (fallback to empty array if undefined)
      setConnectionsList(res?.data?.data || []);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  // 3. Optional: Render an elegant empty state if no data returns
  if (connectionsList.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen">
        <p className="text-[#62718b] font-medium text-lg">No active connections found.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-[#f8fafc] min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-[#091e42]">Your connections</h2>
        <p className="text-[#62718b] font-medium mt-1">
          {connectionsList.length} {connectionsList.length === 1 ? 'developer' : 'developers'} in your network
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectionsList.map((dev) => (
          <div
            key={dev._id || dev.id} 
            className="bg-white border border-[#edf2f7] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 flex flex-col justify-between"
          >
            <div className="flex items-center space-x-4 mb-5">
              <img
                src={dev.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                alt={`${dev.firstName} ${dev.lastName}`}
                className="w-16 h-16 rounded-full object-cover border border-slate-100"
              />
              <div>
                <h3 className="text-lg font-bold text-[#091e42] leading-snug">
                  {dev.firstName} {dev.lastName}
                </h3>
                <p className="text-sm text-[#62718b] font-medium truncate max-w-[200px]">
                  {dev.about || `${dev.age || "N/A"} years old`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {dev.skills && dev.skills.length > 0 ? (
                dev.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-[#edf2f7] text-[#4a5568] text-xs font-semibold px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No skills listed</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-auto">
              <button className="flex-1 py-2.5 px-4 bg-[#f8fafc] border border-[#e2e8f0] text-sm font-semibold text-[#2d3748] rounded-xl shadow-sm hover:bg-[#edf2f7] active:scale-[0.98] transition-all">
                View
              </button>

              <button className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0091ff] hover:bg-[#007be6] text-white text-sm font-semibold rounded-xl shadow-md active:scale-[0.98] transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641l-.318 1.235c-.06.236.164.444.394.36l1.434-.52c.447-.163.933-.105 1.34.152A9.227 9.227 0 0 0 12 20.25z" />
                </svg>
                Chat
              </button>

              <button className="p-2.5 text-[#718096] hover:bg-[#edf2f7] rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.25a7.5 7.5 0 0115 0H4z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Connections;