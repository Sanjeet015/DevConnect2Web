import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import toast from "react-hot-toast";
import { FiUsers, FiPlus, FiTrash2, FiLogOut, FiX, FiInfo, FiMessageSquare } from "react-icons/fi";

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
      toast.success(`You left ${leaveTarget.name}`);
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
      toast.success("Group created successfully!");
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
      <div className="w-full text-center py-20 bg-slate-50 dark:bg-zinc-950 min-h-screen flex items-center justify-center transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-lg"></span>
          <p className="text-slate-400 dark:text-zinc-550 text-xs font-semibold">Resolving communities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 bg-slate-50 dark:bg-zinc-950 min-h-screen font-sans transition-colors duration-200">
      
      {}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#091e42] dark:text-zinc-150 tracking-tight flex items-center gap-2">
            <FiUsers className="text-indigo-600 dark:text-indigo-400" />
            Developer Groups
          </h1>
          <p className="text-[#62718b] dark:text-zinc-450 font-medium text-sm sm:text-base mt-1">
            Build, collaborate, and chat in private developer communities.
          </p>
        </div>

        <button 
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-xs transition duration-200 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <FiPlus size={16} />
          <span>New Group</span>
        </button>
      </div>

      {}
      {groupsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {groupsList.map((group) => (
            <div 
              key={group._id}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)] hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all duration-300 flex flex-col group relative"
            >
              {}
              <div 
                className="h-44 bg-cover bg-center relative flex items-end p-5 transition-all duration-300 group-hover:brightness-105"
                style={{ 
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&auto=format&fit=crop&q=60")` 
                }}
              >
                {}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ _id: group._id, name: group.name });
                  }}
                  title="Delete Group"
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-rose-600 backdrop-blur-md rounded-xl transition text-white shadow-xs group-hover:scale-105 z-10 cursor-pointer"
                >
                  <FiTrash2 size={16} />
                </button>

                <p className="text-white/80 text-xs font-semibold tracking-wide">
                  Created by <span className="font-bold text-white">
                    {group.createdBy?.firstName && group.createdBy?.lastName 
                      ? `${group.createdBy.firstName} ${group.createdBy.lastName}` 
                      : "Developer"}
                  </span>
                </p>
              </div>

              {/* Card Body content */}
              <div className="p-6 flex-1 flex flex-col justify-between bg-white dark:bg-zinc-900">
                <div>
                  <h3 className="text-xl font-bold text-[#091e42] dark:text-zinc-200 tracking-tight line-clamp-1">
                    {group.name}
                  </h3>
                  <p className="text-slate-550 dark:text-zinc-400 font-medium text-xs leading-relaxed mt-2 line-clamp-2 min-h-[36px]">
                    {group.description || "No customized description provided for this group node."}
                  </p>

                  <div className="flex items-center gap-2 mt-4 text-slate-550 dark:text-zinc-450 font-bold text-xs">
                    <FiUsers className="text-slate-400 dark:text-zinc-500" size={16} />
                    <span>{group.memberCount || 0} active members</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
                  <button 
                    onClick={() => navigate(`/group/${group._id}`, { state: { activeTab: "chat" } })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <FiMessageSquare size={13} />
                    <span>Chat Feed</span>
                  </button>

                  <button 
                    onClick={() => navigate(`/group/${group._id}`, { state: { activeTab: "members" } })}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-350 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                    title="Manage Workspace"
                  >
                    <span>Manage</span>
                  </button>

                  <button 
                    onClick={() => setLeaveTarget({ _id: group._id, name: group.name })}
                    title="Leave Group"
                    className="p-3 text-slate-550 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-455 bg-slate-55 dark:bg-zinc-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-slate-200 dark:border-zinc-800 hover:border-rose-100 dark:hover:border-rose-900/30 rounded-xl transition duration-200 cursor-pointer"
                  >
                    <FiLogOut size={16} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full max-w-xl mx-auto border-2 border-dashed border-slate-200 dark:border-zinc-800/80 rounded-[32px] bg-white dark:bg-zinc-900 p-10 sm:p-14 text-center flex flex-col items-center justify-center min-h-[380px] shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition-colors duration-200">
          <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-850 text-indigo-550 rounded-2xl flex items-center justify-center mb-5 shadow-inner">
            <FiUsers size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-200">No Groups Found</h3>
          <p className="text-slate-550 dark:text-zinc-450 font-medium text-xs mt-2 max-w-sm leading-relaxed font-sans">
            You haven't joined any developer groups yet. Start a new team hub to collaborate on code, share portfolios, and chat!
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-6 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition duration-200 cursor-pointer"
          >
            Create Your First Group
          </button>
        </div>
      )}

      {/* Modal: Create New Group */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl w-full max-w-xl border border-slate-200 dark:border-zinc-800/85 overflow-hidden animate-scale-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-900">
              <h2 className="text-xl font-bold text-[#091e42] dark:text-zinc-200 tracking-tight">Create Developer Group</h2>
              <button 
                onClick={() => { setShowCreateModal(false); setNewGroupData({ name: "", description: "" }); }}
                className="text-slate-405 hover:text-slate-650 dark:hover:text-zinc-200 p-1 rounded-lg transition cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5 bg-white dark:bg-zinc-900">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wide mb-2">Group Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={newGroupData.name} 
                  onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })} 
                  placeholder="e.g. Tailwind Wizards, Rust Core Network" 
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none text-xs font-semibold focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-zinc-250 placeholder-slate-400 dark:placeholder-zinc-600 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wide mb-2">Description</label>
                <textarea 
                  value={newGroupData.description} 
                  onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })} 
                  placeholder="What is this workspace focused on?" 
                  rows={4} 
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 outline-none text-xs font-semibold focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-zinc-250 placeholder-slate-400 dark:placeholder-zinc-600 transition-all resize-none" 
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-zinc-800/60 bg-slate-55 dark:bg-zinc-900/60">
              <button 
                onClick={() => { setShowCreateModal(false); setNewGroupData({ name: "", description: "" }); }}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-xl shadow-xs transition hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateGroupSubmit} 
                disabled={loadingCreate || !newGroupData.name.trim()} 
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl transition disabled:bg-slate-105 dark:disabled:bg-zinc-800 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer"
              >
                {loadingCreate ? "Creating Group..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {leaveTarget && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-zinc-800/80 overflow-hidden animate-scale-up">
            <h3 className="text-lg font-bold text-[#091e42] dark:text-zinc-200 mb-2">Leave Group</h3>
            <p className="text-slate-550 dark:text-zinc-400 text-xs leading-relaxed mb-6">
              Are you sure you want to leave <span className="font-bold text-[#091e42] dark:text-zinc-150">{leaveTarget.name}</span>? You will need to be re-invited by a group admin to rejoin.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setLeaveTarget(null)} 
                disabled={loadingLeave}
                className="px-4 py-2 border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleLeaveGroupSubmit} 
                disabled={loadingLeave}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {loadingLeave ? "Leaving..." : "Leave Group"}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-zinc-800/80 overflow-hidden animate-scale-up">
            <h3 className="text-lg font-bold text-rose-600 dark:text-rose-450 mb-2">Delete Group</h3>
            <p className="text-slate-550 dark:text-zinc-400 text-xs leading-relaxed mb-6 font-medium">
              Are you absolutely sure you want to delete <span className="font-bold text-[#091e42] dark:text-zinc-150">{deleteTarget.name}</span>? This action is permanent and cannot be undone. All workspace records and rosters will be deleted.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteTarget(null)} 
                disabled={loadingDelete}
                className="px-4 py-2 border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteGroupSubmit} 
                disabled={loadingDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {loadingDelete ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {errorModalMessage && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-zinc-850/80 animate-scale-up">
            <h3 className="text-base font-bold text-rose-600 dark:text-rose-450 mb-2 flex items-center gap-1.5">
              <FiInfo />
              Operation Error
            </h3>
            <p className="text-slate-655 dark:text-zinc-405 text-xs font-semibold mt-1 break-words">{errorModalMessage}</p>
            <div className="flex justify-end mt-5">
              <button 
                onClick={() => setErrorModalMessage(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-zinc-800 text-white dark:text-zinc-150 rounded-xl text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Groups;