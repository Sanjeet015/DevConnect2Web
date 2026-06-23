import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/constants";

const GroupWorkspace = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [groupData, setGroupData] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]); 
  const [connections, setConnections] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [showMembersList, setShowMembersList] = useState(false);

  const [selectedConnectionId, setSelectedConnectionId] = useState(""); 
  const [selectedRemoveId, setSelectedRemoveId] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const groupRes = await axios.get(`${BASE_URL}/group/${groupId}`, { withCredentials: true });
      setGroupData(groupRes?.data?.data || groupRes?.data);

      const membersRes = await axios.get(`${BASE_URL}/group/${groupId}/members`, { withCredentials: true });
      setGroupMembers(membersRes?.data?.data || []);

      const connectionsRes = await axios.get(`${BASE_URL}/user/connection`, { withCredentials: true });
      setConnections(connectionsRes?.data?.data || connectionsRes?.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch initial workspace parameters", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) fetchData();
  }, [groupId]);

  const eligibleToAdd = connections.filter(
    (conn) => !groupMembers.some((member) => member.userId?._id === conn._id)
  );

  const eligibleToOwn = groupMembers.filter((m) => m.role !== "owner");
  const eligibleToAdmin = groupMembers.filter((m) => m.role !== "admin" && m.role !== "owner");

  const getMemberNameByUserId = (userId) => {
    const member = groupMembers.find((m) => m.userId?._id === userId);
    return member && member.userId ? `${member.userId.firstName} ${member.userId.lastName}` : "this member";
  };

  const executeAddMember = async () => {
    try {
      setActionLoading(true);
      await axios.post(
        `${BASE_URL}/group/${groupId}/add-member`, 
        { userId: selectedConnectionId }, 
        { withCredentials: true }
      );
      showToast("Member added successfully!", "success");
      setSelectedConnectionId("");
      fetchData(); 
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add member", "error");
    } finally {
      setActionLoading(false);
      setConfirmationModal(null);
    }
  };

  const executeRemoveMember = async () => {
    try {
      setActionLoading(true);
      await axios.delete(
        `${BASE_URL}/group/${groupId}/member/${selectedRemoveId}`,  
        { withCredentials: true }
      );
      showToast("Member removed successfully!", "success");
      setSelectedRemoveId("");
      fetchData(); 
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove member", "error");
    } finally {
      setActionLoading(false);
      setConfirmationModal(null);
    }
  };

  const executeTransferOwnership = async () => {
    try {
      setActionLoading(true);
      await axios.patch(
        `${BASE_URL}/group/${groupId}/transfer-ownership/${selectedOwnerId}`, 
        {}, 
        { withCredentials: true }
      );
      showToast("Ownership transferred successfully!", "success");
      setSelectedOwnerId("");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to transfer ownership", "error");
    } finally {
      setActionLoading(false);
      setConfirmationModal(null);
    }
  };

  const executeMakeAdmin = async () => {
    try {
      setActionLoading(true);
      await axios.patch(
        `${BASE_URL}/group/${groupId}/make-admin/${selectedAdminId}`, 
        {}, 
        { withCredentials: true }
      );
      showToast("User promoted to admin successfully!", "success");
      setSelectedAdminId("");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to promote member", "error");
    } finally {
      setActionLoading(false);
      setConfirmationModal(null);
    }
  };

  const triggerConfirmation = (e, type, targetId, title, message) => {
    e.preventDefault();
    if (!targetId) return;
    
    let confirmAction;
    if (type === "add") confirmAction = executeAddMember;
    if (type === "remove") confirmAction = executeRemoveMember;
    if (type === "owner") confirmAction = executeTransferOwnership;
    if (type === "admin") confirmAction = executeMakeAdmin;

    setConfirmationModal({ title, message, onConfirm: confirmAction });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <span className="loading loading-spinner loading-lg text-[#0091ff]"></span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] p-4 sm:p-8 font-sans relative">
      
      {toast && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-bounce-short">
          <div className={`p-4 rounded-xl shadow-xl border flex items-center justify-between text-white font-semibold text-sm ${
            toast.type === "success" ? "bg-emerald-600 border-emerald-500" : "bg-rose-600 border-rose-500"
          }`}>
            <span>{toast.type === "success" ? "✅" : "❌"} {toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-3 text-white/70 hover:text-white font-bold">&times;</button>
          </div>
        </div>
      )}

      {confirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-100 animate-scale-up">
            <h3 className="text-xl window-title font-bold text-[#091e42] mb-2">{confirmationModal.title}</h3>
            <p className="text-[#62718b] text-sm leading-relaxed mb-6">{confirmationModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmationModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmationModal.onConfirm}
                disabled={actionLoading}
                className="px-5 py-2 bg-[#0091ff] hover:bg-[#007be6] text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        <button onClick={() => navigate("/groups")} className="text-sm font-semibold text-[#62718b] hover:text-[#0091ff]">
          ← Back to All Groups
        </button>

        <div className="bg-white border border-[#edf2f7] rounded-[24px] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#091e42]">{groupData?.name || "Group Workspace"}</h1>
              <span className="inline-block mt-1 text-xs bg-blue-50 text-[#0091ff] px-2.5 py-1 rounded-md font-bold">
                {groupMembers.length} Active {groupMembers.length === 1 ? "Member" : "Members"}
              </span>
            </div>
            
            <button
              onClick={() => setShowMembersList(!showMembersList)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 shadow-sm"
            >
              {showMembersList ? "📋 Show Description" : "👥 View All Members"}
            </button>
          </div>

          <hr className="border-slate-100" />

          {!showMembersList ? (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">Description</h4>
              <p className="text-[#62718b] text-sm leading-relaxed">
                {groupData?.description || "No customized description configuration provided."}
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">Group Roster</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                {groupMembers.map((member) => {
                  const user = member?.userId;
                  if (!user) return null;
                  return (
                    <div key={member._id} className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl shadow-inner">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.firstName} className="w-9 h-9 rounded-full object-cover border bg-white shadow-sm" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">
                          {user.firstName[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                        <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-0.5 tracking-wider uppercase border ${
                          member.role === 'owner' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          member.role === 'admin' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#edf2f7] rounded-[24px] p-6 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#091e42]">Group Management Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <form 
              onSubmit={(e) => triggerConfirmation(e, "add", selectedConnectionId, "Add Member", "Are you sure you want to add this connection to the group workspace node?")} 
              className="bg-slate-50 p-4 rounded-xl border flex flex-col justify-between"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">➕ Add Member (My Connections)</label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="w-full bg-white border rounded-lg p-2.5 text-xs outline-none focus:border-[#0091ff]"
                  required
                >
                  <option value="">-- Select a Connection to Add --</option>
                  {eligibleToAdd.map((conn) => (
                    <option key={conn._id} value={conn._id}>
                      {conn.firstName} {conn.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" disabled={actionLoading || !selectedConnectionId} className="mt-4 w-full py-2 bg-[#0091ff] text-white font-bold text-xs rounded-lg hover:bg-[#007be6] disabled:bg-gray-200 disabled:text-gray-400">
                Add Member
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "remove", selectedRemoveId, "Remove Member", `Are you sure you want to completely evict ${getMemberNameByUserId(selectedRemoveId)} from the group configuration?`)} 
              className="bg-slate-50 p-4 rounded-xl border flex flex-col justify-between"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">❌ Remove Member (In-Group Members)</label>
                <select
                  value={selectedRemoveId}
                  onChange={(e) => setSelectedRemoveId(e.target.value)}
                  className="w-full bg-white border rounded-lg p-2.5 text-xs outline-none focus:border-red-500"
                  required
                >
                  <option value="">-- Select Member to Remove --</option>
                  {groupMembers.map((member) => {
                    const user = member?.userId;
                    if (!user) return null;
                    return (
                      <option key={member._id} value={user._id}>
                        {user.firstName} {user.lastName} ({member.role})
                      </option>
                    );
                  })}
                </select>
              </div>
              <button type="submit" disabled={actionLoading || !selectedRemoveId} className="mt-4 w-full py-2 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400">
                Remove Member
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "owner", selectedOwnerId, "Transfer Ownership", `CRITICAL: Are you sure you want to assign root workspace ownership to ${getMemberNameByUserId(selectedOwnerId)}? You will automatically forfeit your root permissions.`)} 
              className="bg-slate-50 p-4 rounded-xl border flex flex-col justify-between"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">👑 Transfer Ownership</label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full bg-white border rounded-lg p-2.5 text-xs outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Select New Owner Target --</option>
                  {eligibleToOwn.map((member) => {
                    const user = member?.userId;
                    if (!user) return null;
                    return (
                      <option key={member._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button type="submit" disabled={actionLoading || !selectedOwnerId} className="mt-4 w-full py-2 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400">
                Transfer Ownership
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "admin", selectedAdminId, "Promote to Admin", `Are you sure you want to grant full group workspace administrative moderation privileges to ${getMemberNameByUserId(selectedAdminId)}?`)} 
              className="bg-slate-50 p-4 rounded-xl border flex flex-col justify-between"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">🛡️ Make Admin</label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full bg-white border rounded-lg p-2.5 text-xs outline-none focus:border-[#0091ff]"
                  required
                >
                  <option value="">-- Select Member to Promote --</option>
                  {eligibleToAdmin.map((member) => {
                    const user = member?.userId;
                    if (!user) return null;
                    return (
                      <option key={member._id} value={user._id}>
                        {user.firstName} {user.lastName}
                      </option>
                    );
                  })}
                </select>
              </div>
              <button type="submit" disabled={actionLoading || !selectedAdminId} className="mt-4 w-full py-2 bg-[#0091ff] text-white font-bold text-xs rounded-lg hover:bg-[#007be6] disabled:bg-gray-200 disabled:text-gray-400">
                Promote to Admin
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
};

export default GroupWorkspace;