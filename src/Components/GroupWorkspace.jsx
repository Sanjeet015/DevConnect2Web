import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { BASE_URL, SOCKET_URL } from "../utils/constants";
import { useSelector } from "react-redux";
import { FiUsers, FiArrowLeft, FiPlus, FiTrash2, FiShield, FiUserCheck, FiList, FiCheck, FiX, FiInfo, FiSend, FiMessageSquare } from "react-icons/fi";

const GroupWorkspace = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useSelector((store) => store.user);

  const [groupData, setGroupData] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]); 
  const [connections, setConnections] = useState([]);   
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "chat"); 

  const [selectedConnectionId, setSelectedConnectionId] = useState(""); 
  const [selectedRemoveId, setSelectedRemoveId] = useState("");
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [confirmationModal, setConfirmationModal] = useState(null);

  const socketRef = useRef(null);
  const chatContainerRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isMessageMine = (msg) => {
    if (!msg || !currentUser) return false;
    return msg.isMine || 
           (msg.sender?.id && currentUser._id && msg.sender.id.toString() === currentUser._id.toString()) || 
           (msg.sender?._id && currentUser._id && msg.sender._id.toString() === currentUser._id.toString()) || 
           (msg.senderId && currentUser._id && msg.senderId.toString() === currentUser._id.toString());
  };

  useEffect(() => {
    if (!groupId) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Joined socket group room:", groupId);
      socket.emit("join_room", groupId);
    });

    socket.on("receive_group_message", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    });

    return () => {
      socket.emit("leave_room", groupId);
      socket.disconnect();
    };
  }, [groupId]);

  const fetchMessages = async (pageToFetch = 1, appendAtTop = false) => {
    try {
      if (pageToFetch === 1) {
        setLoadingMessages(true);
      } else {
        setLoadingMore(true);
      }

      const res = await axios.get(
        `${BASE_URL}/group/${groupId}/messages?page=${pageToFetch}&limit=20`,
        { withCredentials: true }
      );

      const newMsgs = res.data?.data || [];
      const pagination = res.data?.pagination || {};

      setMessages((prev) => {
        if (appendAtTop) {
          const existingIds = new Set(newMsgs.map((m) => m.id));
          const filteredPrev = prev.filter((m) => !existingIds.has(m.id));
          return [...newMsgs, ...filteredPrev];
        } else {
          return newMsgs;
        }
      });

      setHasMore(pagination.hasMore);
      setPage(pageToFetch);

      if (pageToFetch === 1) {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 80);
      }
    } catch (err) {
      console.error("Error fetching group messages:", err);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (groupId && activeTab === "chat") {
      fetchMessages(1, false);
    }
  }, [groupId, activeTab]);

  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollTop === 0 && hasMore && !loadingMore) {
      const currentScrollHeight = container.scrollHeight;
      fetchMessages(page + 1, true).then(() => {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight - currentScrollHeight;
          }
        }, 50);
      });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/group/${groupId}/message`,
        { text: newMessage.trim() },
        { withCredentials: true }
      );
      
      const sentMsg = res.data?.data;
      if (sentMsg) {
        setNewMessage("");
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      showToast("Failed to send message", "error");
    }
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
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-lg"></span>
          <p className="text-slate-400 dark:text-zinc-555 text-xs font-semibold">Opening group workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-zinc-950 p-4 sm:p-8 font-sans transition-colors duration-200 relative any-fade-in-up">
      
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-scale-up">
          <div className={`p-4 rounded-xl shadow-xl border flex items-center justify-between text-white font-semibold text-xs ${
            toastMessage.type === "success" ? "bg-emerald-600 border-emerald-500" : "bg-rose-600 border-rose-500"
          }`}>
            <span className="flex items-center gap-2">
              {toastMessage.type === "success" ? <FiCheck /> : <FiInfo />}
              {toastMessage.message}
            </span>
            <button onClick={() => setToastMessage(null)} className="ml-3 text-white/70 hover:text-white font-bold cursor-pointer">&times;</button>
          </div>
        </div>
      )}

      {confirmationModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-[90] p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-zinc-805 animate-scale-up">
            <h3 className="text-lg font-bold text-[#091e42] dark:text-zinc-200 mb-2">{confirmationModal.title}</h3>
            <p className="text-slate-555 dark:text-zinc-400 text-xs leading-relaxed mb-6 font-medium">{confirmationModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmationModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmationModal.onConfirm}
                disabled={actionLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                {actionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        
        <button 
          onClick={() => navigate("/groups")} 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-555 hover:text-indigo-600 dark:text-zinc-450 dark:hover:text-indigo-400 transition cursor-pointer"
        >
          <FiArrowLeft size={14} />
          <span>Back to Groups</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] dark:text-zinc-155 tracking-tight">{groupData?.name || "Group Workspace"}</h1>
              <span className="inline-block mt-2 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">
                {groupMembers.length} {groupMembers.length === 1 ? "Active Member" : "Active Members"}
              </span>
            </div>
          </div>

          <div className="flex border-b border-slate-100 dark:border-zinc-800/80 mt-2">
            <button
              onClick={() => setActiveTab("chat")}
              className={`pb-3 text-xs font-bold transition-all relative px-4 cursor-pointer ${
                activeTab === "chat"
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-655"
              }`}
            >
              Group Chat 💬
              {activeTab === "chat" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab("members")}
              className={`pb-3 text-xs font-bold transition-all relative px-4 cursor-pointer ${
                activeTab === "members"
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-655"
              }`}
            >
              Members Roster ({groupMembers.length}) 👥
              {activeTab === "members" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("description")}
              className={`pb-3 text-xs font-bold transition-all relative px-4 cursor-pointer ${
                activeTab === "description"
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-400 dark:text-zinc-500 hover:text-slate-655"
              }`}
            >
              Description 📋
              {activeTab === "description" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
              )}
            </button>
          </div>

          {activeTab === "description" && (
            <div className="pt-2">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-555 mb-1.5">Description</h4>
              <p className="text-slate-555 dark:text-zinc-400 text-xs leading-relaxed max-w-3xl font-medium">
                {groupData?.description || "No customized description configuration provided."}
              </p>
            </div>
          )}

          {activeTab === "members" && (
            <div className="pt-2">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-555 mb-3">Group Roster</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2">
                {groupMembers.map((member) => {
                  const user = member?.userId;
                  if (!user) return null;
                  return (
                    <div key={member._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800 rounded-xl shadow-xs">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.firstName} className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-zinc-855 shadow-xs" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                          {user.firstName[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-zinc-255 truncate">{user.firstName} {user.lastName}</p>
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 tracking-wider uppercase border ${
                          member.role === 'owner' ? 'bg-amber-50 dark:bg-amber-955/20 text-amber-600 dark:text-amber-405 border-amber-200 dark:border-amber-900/40' :
                          member.role === 'admin' ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40' : 
                          'bg-slate-105 dark:bg-zinc-855 text-slate-555 dark:text-zinc-400 border-slate-200 dark:border-zinc-800'
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

          {activeTab === "chat" && (
            <div className="flex flex-col h-[460px] border border-slate-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-zinc-955/20 backdrop-blur-xs">
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400"></span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl flex items-center justify-center mb-3">
                      <FiMessageSquare size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-300">Welcome to the Group Chat!</h3>
                    <p className="text-xs text-slate-450 dark:text-zinc-555 mt-1 max-w-xs leading-relaxed">
                      Be the first to say hello to everyone in this workspace community.
                    </p>
                  </div>
                ) : (
                  <>
                    {loadingMore && (
                      <div className="text-center py-2">
                        <span className="loading loading-spinner loading-xs text-indigo-500"></span>
                      </div>
                    )}
                    
                    {messages.map((msg) => {
                      const isMine = isMessageMine(msg);
                      return (
                        <div 
                          key={msg.id}
                          className={`flex items-start gap-3 w-full ${
                            isMine ? "flex-row-reverse" : ""
                          }`}
                        >
                          <img 
                            src={msg.sender?.photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
                            alt={msg.sender?.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-zinc-850 shadow-xs mt-0.5"
                          />
                          
                          <div className={`max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                            <div className="flex items-center gap-2 mb-1 select-none">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                                {msg.sender?.name}
                              </span>
                              <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-555">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            
                            <div className={`px-3.5 py-2 rounded-2xl text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap ${
                              isMine 
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none shadow-xs" 
                                : "bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none shadow-2xs"
                            }`}>
                              {msg.text}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              
              <form 
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 flex gap-2 items-center"
              >
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message to the group..."
                  className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition-all text-slate-800 dark:text-zinc-250 placeholder-slate-400 dark:placeholder-zinc-555"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <FiSend size={14} />
                </button>
              </form>
            </div>
          )}

        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-6">
          <h2 className="text-lg font-bold text-[#091e42] dark:text-zinc-200 tracking-tight flex items-center gap-2">
            <FiShield className="text-indigo-600 dark:text-indigo-400" />
            Group Workspace Management
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <form 
              onSubmit={(e) => triggerConfirmation(e, "add", selectedConnectionId, "Add Member", "Are you sure you want to add this connection to the group workspace node?")} 
              className="bg-slate-50 dark:bg-zinc-955 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850/60 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-800 transition duration-305 shadow-inner"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FiPlus className="text-emerald-600" /> Add Member (My Connections)
                </label>
                <select
                  value={selectedConnectionId}
                  onChange={(e) => setSelectedConnectionId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-zinc-255 cursor-pointer"
                  required
                >
                  <option value="">Select connection to add...</option>
                  {eligibleToAdd.map((conn) => (
                    <option key={conn._id} value={conn._id}>
                      {conn.firstName} {conn.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                disabled={actionLoading || !selectedConnectionId} 
                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:bg-slate-100 dark:disabled:bg-zinc-850 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer"
              >
                Add Member
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "remove", selectedRemoveId, "Remove Member", `Are you sure you want to completely evict ${getMemberNameByUserId(selectedRemoveId)} from the group configuration?`)} 
              className="bg-slate-50 dark:bg-zinc-955 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850/60 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-800 transition duration-305 shadow-inner"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FiTrash2 className="text-rose-600" /> Remove Member (Roster List)
                </label>
                <select
                  value={selectedRemoveId}
                  onChange={(e) => setSelectedRemoveId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-rose-500 text-slate-800 dark:text-zinc-255 cursor-pointer"
                  required
                >
                  <option value="">Select member to remove...</option>
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
              <button 
                type="submit" 
                disabled={actionLoading || !selectedRemoveId} 
                className="mt-5 w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:bg-slate-100 dark:disabled:bg-zinc-850 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer"
              >
                Remove Member
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "owner", selectedOwnerId, "Transfer Ownership", `CRITICAL WARNING: Are you sure you want to transfer ownership to ${getMemberNameByUserId(selectedOwnerId)}? You will automatically forfeit your root workspace owner permission levels.`)} 
              className="bg-slate-50 dark:bg-zinc-955 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850/60 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-800 transition duration-305 shadow-inner"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-355 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FiUserCheck className="text-amber-500" /> Transfer Group Ownership
                </label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => setSelectedOwnerId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-amber-500 text-slate-800 dark:text-zinc-255 cursor-pointer"
                  required
                >
                  <option value="">Select new owner...</option>
                  {eligibleToOwn.map((member) => {
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
              <button 
                type="submit" 
                disabled={actionLoading || !selectedOwnerId} 
                className="mt-5 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:bg-slate-100 dark:disabled:bg-zinc-850 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer"
              >
                Transfer Ownership
              </button>
            </form>

            <form 
              onSubmit={(e) => triggerConfirmation(e, "admin", selectedAdminId, "Promote to Admin", `Are you sure you want to grant group workspace administrative moderation privileges to ${getMemberNameByUserId(selectedAdminId)}?`)} 
              className="bg-slate-50 dark:bg-zinc-955 p-5 rounded-2xl border border-slate-200 dark:border-zinc-850/60 flex flex-col justify-between hover:border-slate-300 dark:hover:border-zinc-800 transition duration-305 shadow-inner"
            >
              <div>
                <label className="block text-[10px] font-bold text-slate-700 dark:text-zinc-350 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <FiShield className="text-indigo-600 dark:text-indigo-400" /> Promote Member to Admin
                </label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-250 dark:border-zinc-800 rounded-xl p-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-zinc-255 cursor-pointer"
                  required
                >
                  <option value="">Select member to promote...</option>
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
              <button 
                type="submit" 
                disabled={actionLoading || !selectedAdminId} 
                className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:bg-slate-100 dark:disabled:bg-zinc-850 disabled:text-slate-400 dark:disabled:text-zinc-600 cursor-pointer"
              >
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