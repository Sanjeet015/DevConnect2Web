import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import axios from "axios";
import { toast } from "react-hot-toast";
import Profile from "./Profile"; // Import your Profile component

const Connections = () => {
  const [connectionsList, setConnectionsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // New state for viewing profile
  const [selectedUser, setSelectedUser] = useState(null);

  const [removing, setRemoving] = useState(false);

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

  if (loading) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen">
        <p className="text-[#62718b] text-lg font-medium">Loading connections...</p>
      </div>
    );
  }

  if (connectionsList.length === 0) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen">
        <p className="text-[#62718b] font-medium text-lg">No active connections found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-7xl mx-auto px-4 py-8 bg-[#f8fafc] min-h-screen">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-[#091e42]">Your connections</h2>
          <p className="text-[#62718b] font-medium mt-1">
            {connectionsList.length} {connectionsList.length === 1 ? "developer" : "developers"} in your network
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connectionsList.map((dev) => (
            <div
              key={dev._id}
              className="bg-white border border-[#edf2f7] rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-4 mb-5">
                  <img
                    src={dev.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={`${dev.firstName} ${dev.lastName}`}
                    className="w-16 h-16 rounded-full object-cover border border-slate-100"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-[#091e42]">
                      {dev.firstName} {dev.lastName}
                    </h3>
                    <p className="text-sm text-[#62718b] font-medium truncate max-w-[200px]">
                      {dev.about || `${dev.age || "N/A"} years old`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {dev.skills?.length > 0 ? (
                    dev.skills.map((skill, index) => (
                      <span key={index} className="bg-[#edf2f7] text-[#4a5568] text-xs font-semibold px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <button 
                  onClick={() => {
                    setSelectedUser(dev);
                    setShowViewModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#f8fafc] border border-[#e2e8f0] text-sm font-semibold text-[#2d3748] rounded-xl shadow-sm hover:bg-[#edf2f7]"
                >
                  View
                </button>

                <button className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0091ff] hover:bg-[#007be6] text-white text-sm font-semibold rounded-xl shadow-md">
                  Chat
                </button>

                <button
                  className="p-2.5 text-[#718096] hover:bg-[#edf2f7] rounded-xl transition-colors"
                  onClick={() => {
                    setSelectedUser(dev);
                    setShowModal(true);
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.25a7.5 7.5 0 0115 0H4z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Connection Profile Modal */}
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
            
            {/* Pass selectedUser as data and true for readOnly mode */}
            <Profile viewedUser={selectedUser} isReadOnly={true} />
          </div>
        </div>
      )}

      {/* Remove Connection Confirmation Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-[#091e42]">Remove Connection</h3>
            <p className="text-[#62718b] mt-3">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-[#091e42]">
                {selectedUser.firstName} {selectedUser.lastName}
              </span>{" "}
              from your connections?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                disabled={removing}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConnection}
                disabled={removing}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white"
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Connections;