import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { BASE_URL, SOCKET_URL } from "../utils/constants";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { FiSend, FiChevronLeft, FiMessageSquare } from "react-icons/fi";
import toast from "react-hot-toast";

function Messages() {
  const currentUser = useSelector((store) => store.user);
  const location = useLocation();
  
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);     
  const [currentPage, setCurrentPage] = useState(1);         
  const [hasMoreMessages, setHasMoreMessages] = useState(false); 
  const [typingUsers, setTypingUsers] = useState({}); 
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to messaging socket server");
    });

    socket.on("status_change", (data) => {
      const { userId, status } = data;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === "online") {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    socket.on("receive_message", (message) => {
      setSelectedChat((currentChat) => {
        if (currentChat && !currentChat.isGroup && currentChat.chatId === message.chatId) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === message.id)) return prev;
            return [...prev, message];
          });
          axios.patch(`${BASE_URL}/chat/messages/${currentChat.chatId}/seen`, {}, { withCredentials: true })
            .catch(err => console.error("Error setting seen:", err));
        } else {
          setConversations((prevChats) =>
            prevChats.map((chat) => {
              if (chat.chatId === message.chatId) {
                return {
                  ...chat,
                  unreadCount: (chat.unreadCount || 0) + 1,
                  lastMessage: message.text,
                  updatedAt: message.createdAt,
                };
              }
              return chat;
            })
          );
        }
        return currentChat;
      });
    });

    socket.on("receive_group_message", (message) => {
      setSelectedChat((currentChat) => {
        if (currentChat && currentChat.isGroup && currentChat.chatId === message.chatId) {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === message.id)) return prev;
            return [...prev, message];
          });
        } else {
          setConversations((prevChats) =>
            prevChats.map((chat) => {
              if (chat.chatId === message.chatId) {
                return {
                  ...chat,
                  unreadCount: (chat.unreadCount || 0) + 1,
                  lastMessage: message.text,
                  updatedAt: message.createdAt,
                };
              }
              return chat;
            })
          );
        }
        return currentChat;
      });
    });

    socket.on("typing_status", (data) => {
      const { roomId, userName, isTyping } = data;
      setTypingUsers((prev) => ({
        ...prev,
        [roomId]: isTyping ? userName : null,
      }));
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  const fetchConversations = async () => {
    try {
      setLoadingChats(true);
      const res = await axios.get(`${BASE_URL}/chat/conversations`, { withCredentials: true });
      setConversations(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch conversations");
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    const targetChatId = location.state?.autoSelectChatId;
    if (targetChatId && conversations.length > 0) {
      const matchingChat = conversations.find(c => c.chatId === targetChatId);
      if (matchingChat) {
        handleSelectChat(matchingChat);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state?.autoSelectChatId, conversations]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(false);
    
    if (socketRef.current) {
      socketRef.current.emit("join_room", chat.chatId);
    }

    try {
      setLoadingMessages(true);
      const url = chat.isGroup
        ? `${BASE_URL}/group/${chat.chatId}/messages?limit=50&page=1`
        : `${BASE_URL}/chat/messages/${chat.chatId}?limit=50&page=1`;

      const res = await axios.get(url, { withCredentials: true });
      setMessages(res.data?.data || []);
      setHasMoreMessages(res.data?.pagination?.hasMore || false);
      
      setConversations((prev) =>
        prev.map((c) => (c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c))
      );

      if (!chat.isGroup) {
        await axios.patch(`${BASE_URL}/chat/messages/${chat.chatId}/seen`, {}, { withCredentials: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chat history");
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleLoadMore = async () => {
    if (!selectedChat || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const url = selectedChat.isGroup
        ? `${BASE_URL}/group/${selectedChat.chatId}/messages?limit=50&page=${nextPage}`
        : `${BASE_URL}/chat/messages/${selectedChat.chatId}?limit=50&page=${nextPage}`;

      const res = await axios.get(url, { withCredentials: true });
      const olderMessages = res.data?.data || [];
      setMessages((prev) => [...olderMessages, ...prev]);
      setCurrentPage(nextPage);
      setHasMoreMessages(res.data?.pagination?.hasMore || false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load earlier messages");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChat) return;

    const messageText = newMessageText.trim();
    setNewMessageText("");

    if (!selectedChat.isGroup && socketRef.current) {
      socketRef.current.emit("typing_stop", {
        roomId: selectedChat.chatId,
        userName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "",
      });
    }

    try {
      const url = selectedChat.isGroup
        ? `${BASE_URL}/group/${selectedChat.chatId}/message`
        : `${BASE_URL}/chat/message`;

      const payload = selectedChat.isGroup
        ? { text: messageText }
        : { chatId: selectedChat.chatId, text: messageText };

      const res = await axios.post(url, payload, { withCredentials: true });
      
      const sentMessage = res.data?.data;
      if (sentMessage) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMessage.id)) return prev;
          return [...prev, sentMessage];
        });
        
        setConversations((prev) =>
          prev.map((c) =>
            c.chatId === selectedChat.chatId
              ? { ...c, lastMessage: messageText, updatedAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);
    if (!selectedChat || selectedChat.isGroup || !socketRef.current) return;

    socketRef.current.emit("typing_start", {
      roomId: selectedChat.chatId,
      userName: currentUser?.firstName || "",
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing_stop", {
        roomId: selectedChat.chatId,
        userName: currentUser?.firstName || "",
      });
    }, 2000);
  };

  const getPartnerName = (chat) => {
    if (chat.isGroup) {
      return chat.group?.name || chat.user.lastName;
    }
    return `${chat.user.firstName} ${chat.user.lastName}`;
  };

  return (
    <div className="w-full h-[calc(100vh-9.5rem)] md:h-[calc(100vh-4rem)] flex bg-[#f8fafc] dark:bg-zinc-950 font-sans transition-colors">
      
      <div
        className={`${
          selectedChat ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col h-full shrink-0`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#091e42] dark:text-zinc-150">Developer Chats</h1>
          <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-100/30 dark:border-indigo-900/20">
            {conversations.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingChats ? (
            <div className="h-full flex items-center justify-center">
              <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400 loading-md"></span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 dark:text-zinc-500">
              <FiMessageSquare size={36} className="mb-2 text-slate-300 dark:text-zinc-700" />
              <p className="text-sm font-medium">No active developer chats yet.</p>
              <p className="text-xs mt-1">Chat in groups or get matches to start messaging!</p>
            </div>
          ) : (
            conversations.map((chat) => {
              const isPartnerOnline = !chat.isGroup && onlineUserIds.has(chat.user._id);
              const isSelected = selectedChat?.chatId === chat.chatId;

              return (
                <button
                  key={chat.chatId}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "bg-white dark:bg-zinc-900 border-transparent hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={chat.user.photoUrl}
                      alt={chat.user.firstName}
                      className="w-12 h-12 rounded-full object-cover border dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    />
                    {!chat.isGroup && (
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-zinc-900 ${
                          isPartnerOnline ? "bg-emerald-500" : "bg-slate-350 dark:bg-zinc-700"
                        }`}
                      ></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {getPartnerName(chat)}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-medium">
                        {chat.updatedAt
                          ? new Date(chat.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-medium">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        className={`${
          selectedChat ? "flex" : "hidden md:flex"
        } flex-1 flex-col h-full bg-slate-50/50 dark:bg-zinc-950/20`}
      >
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition text-slate-555 dark:text-zinc-400 cursor-pointer"
                >
                  <FiChevronLeft size={22} />
                </button>

                <div className="relative">
                  <img
                    src={selectedChat.user.photoUrl}
                    alt={selectedChat.user.firstName}
                    className="w-10 h-10 rounded-full object-cover border dark:border-zinc-800"
                  />
                  {!selectedChat.isGroup && (
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                        onlineUserIds.has(selectedChat.user._id) ? "bg-emerald-500" : "bg-slate-350 dark:bg-zinc-700"
                      }`}
                    ></span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                    {getPartnerName(selectedChat)}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-550">
                    {selectedChat.isGroup ? "Group Workspace Chat" : onlineUserIds.has(selectedChat.user._id) ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <span className="loading loading-spinner text-indigo-600 dark:text-indigo-400"></span>
                </div>
              ) : (
                <>
                  {hasMoreMessages && (
                    <div className="flex justify-center pt-2 pb-1">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-350 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/30 dark:border-indigo-900/30 px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                      >
                        {loadingMore ? (
                          <span className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : null}
                        {loadingMore ? "Loading..." : "↑ Load earlier messages"}
                      </button>
                    </div>
                  )}
                  {messages.map((msg, index) => {
                    const isMine = msg.isMine || msg.sender?.id === currentUser?._id || msg.sender?._id === currentUser?._id || msg.senderId === currentUser?._id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex items-start gap-2.5 w-full ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        {selectedChat.isGroup && !isMine && (
                          <img
                            src={msg.sender?.photoUrl || "https://png.pngtree.com/png-clipart/20210915/ourmid/pngtree-user-avatar-placeholder-png-image_3918418.jpg"}
                            alt={msg.sender?.name}
                            className="w-8 h-8 rounded-full object-cover border dark:border-zinc-800 mt-0.5 shadow-2xs"
                            title={msg.sender?.name}
                          />
                        )}
                        
                        <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          {selectedChat.isGroup && !isMine && (
                            <span className="text-[10px] font-bold text-slate-455 dark:text-zinc-500 mb-0.5 ml-1 select-none">
                              {msg.sender?.name}
                            </span>
                          )}
                          
                          <div
                            className={`px-4 py-2.5 rounded-2xl shadow-xs text-xs font-semibold leading-relaxed break-words whitespace-pre-wrap ${
                              isMine
                                ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none"
                                : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 border border-slate-100 dark:border-zinc-800 rounded-tl-none"
                            }`}
                          >
                            <p>{msg.text}</p>
                            <div
                              className={`flex items-center gap-1 justify-end mt-1 text-[8px] font-medium ${
                                isMine ? "text-white/70" : "text-slate-400 dark:text-zinc-555"
                              }`}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {isMine && !selectedChat.isGroup && <span>{msg.isSeen ? "• Read" : ""}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers[selectedChat.chatId] && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-zinc-900 text-slate-400 dark:text-zinc-555 border border-slate-100 dark:border-zinc-800 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-1 shadow-xs font-medium">
                        <span>{typingUsers[selectedChat.chatId]} is typing</span>
                        <span className="flex gap-0.5 ml-1">
                          <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-600 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-zinc-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex gap-2 items-center"
            >
              <input
                type="text"
                value={newMessageText}
                onChange={handleInputChange}
                placeholder="Type a message to collaborate..."
                className="flex-1 bg-[#f8fafc] dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-white dark:focus:bg-zinc-950 transition text-slate-800 dark:text-zinc-250"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl shadow-xs transition disabled:bg-slate-105 dark:disabled:bg-zinc-800 disabled:text-slate-405 dark:disabled:text-zinc-650 cursor-pointer"
              >
                <FiSend size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-zinc-900/20 backdrop-blur-md">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <FiMessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-zinc-200">Select a Developer</h3>
            <p className="text-slate-550 dark:text-zinc-450 font-medium text-sm mt-1 max-w-sm">
              Start a real-time conversation to exchange ideas, share projects, or build developer communities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;