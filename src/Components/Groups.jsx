import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import toast from "react-hot-toast";

const Groups = () => {
  const navigate = useNavigate(); 
  const [groupsList, setGroupsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
  });
  const [errorModalMessage, setErrorModalMessage] = useState(null);
  const [leaveTarget, setLeaveTarget] = useState(null); 
  const [loadingLeave, setLoadingLeave] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [loadingDelete, setLoadingDelete] = useState(false);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/groups/my`, { withCredentials: true });
      const incomingData = res?.data?.data || res?.data;
      const initialGroups = Array.isArray(incomingData) ? incomingData : [];

      const groupsWithResolvedCounts = await Promise.all(
        initialGroups.map(async (group) => {
          try {
            const membersRes = await axios.get(`${BASE_URL}/group/${group._id}/members`, { withCredentials: true });
            const membersData = membersRes?.data?.data || membersRes?.data || [];
            return {
              ...group,
              memberCount: Array.isArray(membersData) ? membersData.length : 1
            };
          } catch (err) {
            console.error(`Error resolving member count for group ${group._id}:`, err);
            return { ...group, memberCount: 1 }; 
          }
        })
      );

      setGroupsList(groupsWithResolvedCounts);
    } catch (err) {
      console.error("Error fetching groups list ecosystem:", err);
      setGroupsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, []);

  const handleLeaveGroupSubmit = async () => {
    if (!leaveTarget) return;
    try {
      setLoadingLeave(true);
      await axios.post(`${BASE_URL}/group/${leaveTarget._id}/leave`, {}, { withCredentials: true });
      setGroupsList((prev) => prev.filter((group) => group._id !== leaveTarget._id));
      setLeaveTarget(null);
    } catch (err) {
      console.error("Error leaving group:", err);
      const serverErrorMessage = err.response?.data?.message || err.message || "Failed to leave group.";
      setErrorModalMessage(serverErrorMessage);
    } finally {
      setLoadingLeave(false);
    }
  };

  const handleDeleteGroupSubmit = async () => {
    if (!deleteTarget) return;
    try {
      setLoadingDelete(true);
      await axios.delete(`${BASE_URL}/group/${deleteTarget._id}`, { withCredentials: true });
      setGroupsList((prev) => prev.filter((group) => group._id !== deleteTarget._id));
      toast.success("Group deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Failed to delete the group");
      console.error("Error deleting group:", err);
      const serverErrorMessage = err.response?.data?.message || err.message || "Failed to delete group.";
      setErrorModalMessage(serverErrorMessage);
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleCreateGroupSubmit = async () => {
    if (!newGroupData.name.trim()) {
      setErrorModalMessage("Group Name is required.");
      return;
    }

    try {
      setLoadingCreate(true);
      const res = await axios.post(
        `${BASE_URL}/groups`,
        {
          name: newGroupData.name,
          description: newGroupData.description,
        },
        { withCredentials: true }
      );

      const createdGroup = res?.data?.data || res?.data;
      if (!createdGroup) throw new Error("No data received from creation API");

      const configuredGroup = {
        ...createdGroup,
        memberCount: 1
      };

      setGroupsList((prev) => [...prev, configuredGroup]);
      setNewGroupData({ name: "", description: "" });
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating group:", err);
      const serverErrorMessage = err.response?.data?.message || err.message || "Failed to create group.";
      setErrorModalMessage(serverErrorMessage);
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleOpenGroup = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  if (loading) {
    return (
      <div className="w-full text-center py-20 bg-[#f8fafc] min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#0091ff]"></span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12 bg-[#f8fafc] min-h-screen font-sans">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-[#091e42] tracking-tight">
            Groups
          </h1>
          <p className="text-[#62718b] font-medium text-lg mt-1">
            Communities you're part of
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0091ff] hover:bg-[#007be6] text-white font-semibold rounded-2xl shadow-md transition-all duration-200 shrink-0 self-start sm:self-center"
        >
          <span className="text-xl font-light leading-none">+</span>
          <span>New group</span>
        </button>
      </div>

      {groupsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupsList.map((group) => (
            <div 
              key={group._id}
              className="bg-white rounded-[32px] border border-[#edf2f7] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] transition-all duration-300 flex flex-col group relative"
            >
              
              <div 
                className="h-48 bg-cover bg-center relative flex items-end p-6"
                style={{ 
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url("https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60")` 
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ _id: group._id, name: group.name });
                  }}
                  title="Delete Group"
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-600 backdrop-blur-md rounded-xl transition-all text-white shadow-sm group-hover:scale-105 z-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.106 0 00-7.5 0" />
                  </svg>
                </button>

                <p className="text-white/80 text-sm font-medium tracking-wide">
                  by <span className="font-semibold text-white">
                    {group.createdBy?.firstName && group.createdBy?.lastName 
                      ? `${group.createdBy.firstName} ${group.createdBy.lastName}` 
                      : "Unknown"}
                  </span>
                </p>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-[#091e42] tracking-tight line-clamp-1">
                    {group.name}
                  </h3>
                  <p className="text-[#62718b] font-medium text-[15px] mt-2 line-clamp-2 min-h-[44px]">
                    {group.description || "No description provided for this group."}
                  </p>

                  <div className="flex items-center gap-2 mt-4 text-[#62718b] font-semibold text-sm">
                    <svg className="w-5 h-5 text-[#8993a4]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span>{group.memberCount || 0} members</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <button 
                    onClick={() => handleOpenGroup(group._id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 bg-[#0091ff] hover:bg-[#007be6] text-white font-bold text-base rounded-2xl shadow-sm transition-colors"
                  >
                    <span>Open</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>

                  <button 
                    onClick={() => setLeaveTarget({ _id: group._id, name: group.name })}
                    title="Leave Group"
                    className="p-3.5 text-[#62718b] hover:text-red-600 bg-white hover:bg-red-50 border border-[#e2e8f0] hover:border-red-100 rounded-2xl transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full border-2 border-dashed border-[#edf2f7] rounded-[32px] bg-white p-12 text-center flex flex-col items-center justify-center min-h-[400px] shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
          <div className="w-16 h-16 bg-[#edf2f7] text-[#0091ff] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-[#091e42]">No groups found</h3>
          <p className="text-[#62718b] font-medium text-sm mt-1 max-w-sm">
            You haven't joined any developer communities yet. Create a new group to start collaborating!
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-6 px-5 py-2.5 bg-[#0091ff] hover:bg-[#007be6] text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto p-4">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-2xl my-auto flex flex-col max-h-[calc(100vh-4rem)] border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-200/60">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Create New Group</h2>
              <button onClick={() => { setShowCreateModal(false); setNewGroupData({ name: "", description: "" }); }} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name <span className="text-red-500">*</span></label>
                <input type="text" value={newGroupData.name} onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })} placeholder="React Wizards" className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none text-sm focus:border-blue-500 transition-all font-medium" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea value={newGroupData.description} onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })} placeholder="Group focus..." rows={4} className="w-full bg-white border border-gray-200 rounded-xl p-3 outline-none text-sm focus:border-blue-500 transition-all resize-none font-medium" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200/60 bg-gray-100/70 rounded-b-3xl">
              <button onClick={() => { setShowCreateModal(false); setNewGroupData({ name: "", description: "" }); }} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl shadow-sm">Cancel</button>
              <button onClick={handleCreateGroupSubmit} disabled={loadingCreate || !newGroupData.name.trim()} className="px-5 py-2.5 bg-[#0091ff] text-white font-medium rounded-xl">{loadingCreate ? "Creating..." : "Create Group"}</button>
            </div>
          </div>
        </div>
      )}

      {leaveTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-[#091e42] mb-2">Leave Group</h3>
            <p className="text-[#62718b] text-sm leading-relaxed mb-6">Are you sure you want to leave <span className="font-bold text-[#091e42]">{leaveTarget.name}</span>?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setLeaveTarget(null)} disabled={loadingLeave} className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl">Cancel</button>
              <button onClick={handleLeaveGroupSubmit} disabled={loadingLeave} className="px-4 py-2 bg-red-600 text-white font-semibold text-sm rounded-xl">{loadingLeave ? "Leaving..." : "Yes, Leave Group"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-100">
            <h3 className="text-xl font-bold text-red-600 mb-2">Delete Group</h3>
            <p className="text-[#62718b] text-sm leading-relaxed mb-6">
              Are you absolutely sure you want to delete <span className="font-bold text-[#091e42]">{deleteTarget.name}</span>? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={loadingDelete} className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl">Cancel</button>
              <button onClick={handleDeleteGroupSubmit} disabled={loadingDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm rounded-xl shadow-sm transition">{loadingDelete ? "Deleting..." : "Delete Permanently"}</button>
            </div>
          </div>
        </div>
      )}

      {errorModalMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-red-500">
            <h3 className="text-lg font-bold text-gray-900">Operation Error</h3>
            <p className="text-gray-600 text-sm mt-1 break-words">{errorModalMessage}</p>
            <div className="flex justify-end mt-4"><button onClick={() => setErrorModalMessage(null)} className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium">Dismiss</button></div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Groups;