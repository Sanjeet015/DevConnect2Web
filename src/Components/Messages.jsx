import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { BASE_URL } from "../utils/constants";
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
  const [loadingMore, setLoadingMore] = useState(false);     // Fix #13: pagination loading
  const [currentPage, setCurrentPage] = useState(1);         // Fix #13: current page
  const [hasMoreMessages, setHasMoreMessages] = useState(false); // Fix #13: more available
  const [typingUsers, setTypingUsers] = useState({}); // roomId -> { userName, isTyping }
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Initialize Socket.IO connection
  useEffect(() => {
    if (!currentUser) return;

    // Connect to Socket.IO Server
    const socketUrl = BASE_URL.replace("/api", "");
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to messaging socket server");
    });

    // Listen for online status updates
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

    // Listen for incoming messages
    socket.on("receive_message", (message) => {
      // If the message belongs to the active chat, append it
      setSelectedChat((currentChat) => {
        if (currentChat && currentChat.chatId === message.chatId) {
          setMessages((prev) => {
            // Check for duplicates
            if (prev.some((msg) => msg.id === message.id)) return prev;
            return [...prev, message];
          });
          // Mark as seen immediately if active
          axios.patch(`${BASE_URL}/chat/messages/${currentChat.chatId}/seen`, {}, { withCredentials: true })
            .catch(err => console.error("Error setting seen:", err));
        } else {
          // Increment unread count in conversations list
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

    // Listen for typing events
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

  // 2. Fetch conversations
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

  // Handle auto-selection of chat from navigation state
  useEffect(() => {
    const targetChatId = location.state?.autoSelectChatId;
    if (targetChatId && conversations.length > 0) {
      const matchingChat = conversations.find(c => c.chatId === targetChatId);
      if (matchingChat) {
        handleSelectChat(matchingChat);
        // Clear the state so we don't keep auto-selecting if user navigates back
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state?.autoSelectChatId, conversations]);

  // Fix #13: Select a conversation — load page 1, track hasMore
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    setCurrentPage(1);
    setHasMoreMessages(false);
    
    // Join the socket room
    if (socketRef.current) {
      socketRef.current.emit("join_room", chat.chatId);
    }

    try {
      setLoadingMessages(true);
      const res = await axios.get(`${BASE_URL}/chat/messages/${chat.chatId}?limit=50&page=1`, { withCredentials: true });
      setMessages(res.data?.data || []);
      setHasMoreMessages(res.data?.pagination?.hasMore || false);
      
      // Clear unread counts for this chat
      setConversations((prev) =>
        prev.map((c) => (c.chatId === chat.chatId ? { ...c, unreadCount: 0 } : c))
      );

      // Mark messages as seen in backend
      await axios.patch(`${BASE_URL}/chat/messages/${chat.chatId}/seen`, {}, { withCredentials: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load chat history");
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fix #13: Load earlier messages (page 2, 3, ...) and prepend to list
  const handleLoadMore = async () => {
    if (!selectedChat || loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const res = await axios.get(
        `${BASE_URL}/chat/messages/${selectedChat.chatId}?limit=50&page=${nextPage}`,
        { withCredentials: true }
      );
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

  // 4. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // 5. Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedChat) return;

    const messageText = newMessageText.trim();
    setNewMessageText("");

    // Stop typing notification immediately
    if (socketRef.current) {
      socketRef.current.emit("typing_stop", {
        roomId: selectedChat.chatId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
      });
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/chat/message`,
        { chatId: selectedChat.chatId, text: messageText },
        { withCredentials: true }
      );
      
      const sentMessage = res.data?.data;
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
        
        // Update local conversation preview
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

  // 6. Handle Typing Notifier
  const handleInputChange = (e) => {
    setNewMessageText(e.target.value);
    if (!selectedChat || !socketRef.current) return;

    // Emit start typing
    socketRef.current.emit("typing_start", {
      roomId: selectedChat.chatId,
      userName: currentUser.firstName,
    });

    // Debounce stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("typing_stop", {
        roomId: selectedChat.chatId,
        userName: currentUser.firstName,
      });
    }, 2000);
  };

  const getPartnerName = (chat) => `${chat.user.firstName} ${chat.user.lastName}`;

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex bg-[#f8fafc] font-sans">
      {/* Conversations Left Panel */}
      <div
        className={`${
          selectedChat ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex-col h-full shrink-0`}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#091e42]">Developer Chats</h1>
          <span className="bg-blue-50 text-[#0091ff] text-xs font-bold px-2.5 py-1 rounded-full">
            {conversations.length} Active
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
          {loadingChats ? (
            <div className="h-full flex items-center justify-center">
              <span className="loading loading-spinner text-[#0091ff] loading-md"></span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <FiMessageSquare size={36} className="mb-2 text-slate-300" />
              <p className="text-sm font-medium">No active developer chats yet.</p>
              <p className="text-xs mt-1">Get match requests accepted on Feed to start chatting!</p>
            </div>
          ) : (
            conversations.map((chat) => {
              const isPartnerOnline = onlineUserIds.has(chat.user._id);
              const isSelected = selectedChat?.chatId === chat.chatId;

              return (
                <button
                  key={chat.chatId}
                  onClick={() => handleSelectChat(chat)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left border ${
                    isSelected
                      ? "bg-blue-50/70 border-blue-100 shadow-sm"
                      : "bg-white border-transparent hover:bg-slate-50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={chat.user.photoUrl}
                      alt={chat.user.firstName}
                      className="w-12 h-12 rounded-full object-cover border bg-white"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isPartnerOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    ></span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {getPartnerName(chat)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {chat.updatedAt
                          ? new Date(chat.updatedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-medium">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="bg-[#0091ff] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message History Right Panel */}
      <div
        className={`${
          selectedChat ? "flex" : "hidden md:flex"
        } flex-1 flex-col h-full bg-slate-50/50`}
      >
        {selectedChat ? (
          <>
            {/* Chat Pane Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition text-slate-500"
                >
                  <FiChevronLeft size={22} />
                </button>

                <div className="relative">
                  <img
                    src={selectedChat.user.photoUrl}
                    alt={selectedChat.user.firstName}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      onlineUserIds.has(selectedChat.user._id) ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  ></span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {getPartnerName(selectedChat)}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-400">
                    {onlineUserIds.has(selectedChat.user._id) ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Message Box */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <span className="loading loading-spinner text-[#0091ff]"></span>
                </div>
              ) : (
                <>
                  {/* Fix #13: Load Earlier Messages button */}
                  {hasMoreMessages && (
                    <div className="flex justify-center pt-2 pb-1">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="text-xs font-bold text-[#0091ff] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {loadingMore ? (
                          <span className="w-3.5 h-3.5 border-2 border-[#0091ff] border-t-transparent rounded-full animate-spin inline-block" />
                        ) : null}
                        {loadingMore ? "Loading..." : "↑ Load earlier messages"}
                      </button>
                    </div>
                  )}
                  {messages.map((msg, index) => {
                    const isMine = msg.isMine || msg.sender?.id === currentUser._id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                            isMine
                              ? "bg-[#0091ff] text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                          }`}
                        >
                          <p className="leading-relaxed font-medium">{msg.text}</p>
                          <div
                            className={`flex items-center gap-1 justify-end mt-1 text-[9px] ${
                              isMine ? "text-white/70" : "text-slate-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isMine && <span>{msg.isSeen ? "• Read" : ""}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers[selectedChat.chatId] && (
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-400 border border-slate-100 px-4 py-2.5 rounded-2xl rounded-bl-none text-xs flex items-center gap-1 shadow-sm font-medium">
                        <span>{typingUsers[selectedChat.chatId]} is typing</span>
                        <span className="flex gap-0.5 ml-1">
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Send Input Box */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t border-slate-200 flex gap-2 items-center"
            >
              <input
                type="text"
                value={newMessageText}
                onChange={handleInputChange}
                placeholder="Type a message to collaborate..."
                className="flex-1 bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-[#0091ff] focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="p-3 bg-[#0091ff] hover:bg-[#007be6] text-white rounded-xl shadow-sm transition disabled:bg-slate-100 disabled:text-slate-400"
              >
                <FiSend size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-md">
            <div className="w-16 h-16 bg-blue-50 text-[#0091ff] rounded-2xl flex items-center justify-center mb-4 shadow-inner">
              <FiMessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Select a Developer</h3>
            <p className="text-slate-500 font-medium text-sm mt-1 max-w-sm">
              Start a real-time conversation to exchange ideas, share projects, or build developer communities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;