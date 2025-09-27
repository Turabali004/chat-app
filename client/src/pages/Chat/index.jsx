import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import io from "socket.io-client";

// Icons
import { Send, Search, MoreVertical, Phone, Video, Smile, Paperclip, Settings, LogOut, Menu, X } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";

// UI Components
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar, AvatarImage } from "../../components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";

// store
import { useAppStore } from "../../store";
import { getColor } from "../../../lib/utils";

// API
import {
  fetchContacts,
  fetchRequests,
  fetchMessages,
  sendMessage as sendMessageApi,
  acceptRequest as acceptReq,
  rejectRequest as rejectReq,
  fetchAllUsers,
  findByUsername,
} from "../../lib/messages-api";

// Simple user finder to initiate new chats (creates a request on first message)
function FindUsers({ onSelectUser }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usernameQuery, setUsernameQuery] = useState("");
  const [searchingUsername, setSearchingUsername] = useState(false);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await fetchAllUsers();
        if (!ignore) setUsers(data?.users || []);
      } catch (e) {
        // no-op
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const filtered = users.filter((u) => {
    const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim().toLowerCase();
    const email = (u.email || "").toLowerCase();
    const q = query.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleUsernameSearch = async (e) => {
    e.preventDefault();
    const uname = usernameQuery.trim();
    if (!uname) return;
    try {
      setSearchingUsername(true);
      const { data } = await findByUsername(uname);
      if (data?.user) {
        onSelectUser(data.user);
        toast.info("Type a message to send a request.");
      }
    } catch (err) {
      toast.error("User not found");
    } finally {
      setSearchingUsername(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3">
      {/* Exact username search */}
      <form onSubmit={handleUsernameSearch} className="flex gap-2">
        <Input
          value={usernameQuery}
          onChange={(e) => setUsernameQuery(e.target.value)}
          placeholder="Search by username (exact)"
          className="bg-gray-50 dark:bg-gray-700 border-none"
        />
        <Button type="submit" disabled={searchingUsername}>
          {searchingUsername ? "Searching..." : "Start"}
        </Button>
      </form>

      {/* Broad search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Browse users by name or email..."
          className="pl-10 bg-gray-50 dark:bg-gray-700 border-none"
        />
      </div>
      {loading && <div className="p-2 text-sm text-gray-500">Loading users...</div>}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.map((u) => (
          <div key={u._id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="w-9 h-9">
                {u.image ? (
                  <AvatarImage src={u.image} alt="profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                    {(u.firstName?.[0] || u.email?.[0] || "U").toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email}
                </p>
                <p className="text-xs text-gray-500 truncate">@{u.username || ""}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => onSelectUser(u)}>Message</Button>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div className="p-2 text-sm text-gray-500">No users found</div>
        )}
      </div>
    </div>
  );
}

const Chat = () => {
  const { userInfo } = useAppStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("conversations");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!userInfo?.profileSetup) {
      toast("Please setup profile to continue.");
      navigate("/profile");
      return;
    }

    // Load contacts and requests
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: c }, { data: r }] = await Promise.all([fetchContacts(), fetchRequests()]);
        setContacts(c?.contacts || []);
        setRequests(r?.requests || []);
      } catch (e) {
        // no-op
      } finally {
        setLoading(false);
      }
    };
    load();

    // Initialize socket connection
    const token = sessionStorage.getItem("token");
    if (token) { 
      const newSocket = io("http://localhost:5000", { auth: { token } });

      newSocket.on("connect", () => {
        setSocket(newSocket);
      });

      newSocket.on("message", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on("typing", ({ userId, isTyping }) => {
        setIsTyping(isTyping);
      });

      newSocket.on("user_status", ({ userId, status }) => {
        setOnlineUsers((prev) => (status === "online" ? [...prev, userId] : prev.filter((id) => id !== userId)));
      });

      // New: message request events
      newSocket.on("message_request", (payload) => {
        setRequests((prev) => (prev.some((x) => x.threadId === payload.threadId) ? prev : [payload, ...prev]));
      });

      newSocket.on("request_accepted", ({ threadId }) => {
        setRequests((prev) => prev.filter((r) => r.threadId !== threadId));
        fetchContacts().then(({ data }) => setContacts(data?.contacts || [])).catch(() => {});
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectContact = (c) => {
    const id = c._id || c.id;
    const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.name || c.email;
    setSelectedContact({ id, name, threadId: c.threadId, isRequest: false, online: onlineUsers.includes(id) });
    setIsMobileSidebarOpen(false);
    if (c._id) {
      fetchMessages(c._id)
        .then(({ data }) => setMessages(data?.messages || []))
        .catch(() => setMessages([]));
    } else {
      setMessages([]);
    }
  };

  const selectRequest = (r) => {
    const from = r.from;
    const id = from._id;
    const name = `${from.firstName ?? ""} ${from.lastName ?? ""}`.trim() || from.email;
    setSelectedContact({ id, name, threadId: r.threadId, isRequest: true, preview: r.preview, time: r.time });
    setMessages([]);
    setIsMobileSidebarOpen(false);
  };

  const handleAccept = async (threadId) => {
    try {
      await acceptReq(threadId);
      setRequests((prev) => prev.filter((r) => r.threadId !== threadId));
      const { data } = await fetchContacts();
      setContacts(data?.contacts || []);
      toast.success("Request accepted");
      // If currently viewing this request, mark as accepted in UI
      setSelectedContact((prev) => (prev && prev.threadId === threadId ? { ...prev, isRequest: false } : prev));
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (threadId) => {
    try {
      await rejectReq(threadId);
      setRequests((prev) => prev.filter((r) => r.threadId !== threadId));
      toast.success("Request rejected");
      setSelectedContact((prev) => (prev && prev.threadId === threadId ? null : prev));
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    if (selectedContact.isRequest) {
      toast.info("Accept the request to start messaging.");
      return;
    }

    const payload = { receiver: selectedContact.id, content: newMessage.trim() };

    // Optimistic UI
    const tempMessage = {
      _id: Date.now(),
      sender: { _id: userInfo.id, username: `${userInfo.firstName} ${userInfo.lastName}`.trim() },
      receiver: { _id: selectedContact.id, username: selectedContact.name },
      content: newMessage.trim(),
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      await sendMessageApi(payload);
      socket?.emit?.("message", payload);
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    if (socket) socket.disconnect();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 relative">
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col absolute lg:relative z-30 h-full lg:translate-x-0 transition-transform duration-300 ${
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Chats</h1>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
              {/* Mobile Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-12 h-12">
              {userInfo.image ? (
                <AvatarImage src={userInfo.image} alt="profile" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-white text-lg font-bold ${getColor(userInfo.color || 0)}`}>
                  {userInfo.firstName?.[0] || userInfo.email[0]}
                </div>
              )}
            </Avatar>
            <div>
              <p className="font-medium text-gray-800 dark:text-white">
                {userInfo.firstName} {userInfo.lastName}
              </p>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search conversations..." className="pl-10 bg-gray-50 dark:bg-gray-700 border-none" />
          </div>
        </div>

        {/* Lists with Tabs */}
        <div className="p-4 pt-2 flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="conversations">Conversations</TabsTrigger>
              <TabsTrigger value="requests">
                <span className="flex items-center gap-2">
                  Requests
                  {requests.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center text-xs font-medium bg-red-500 text-white rounded-full w-5 h-5">
                      {requests.length}
                    </span>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="find">Find Users</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="flex-1">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && <div className="p-3 text-sm text-gray-500">Loading...</div>}
                {contacts.map((c, index) => (
                  <div
                    key={c._id || index}
                    onClick={() => selectContact(c)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedContact?.id === (c._id || c.id) ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500" : ""
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                            {(c.firstName?.[0] || c.email?.[0] || "U").toUpperCase()}
                          </div>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-gray-800 dark:text-white truncate">
                            {`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || c.email}
                          </p>
                          <span className="text-xs text-gray-500">
                            {c.lastMessageTime ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate">{c.lastMessage || ""}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="flex-1">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && <div className="p-3 text-sm text-gray-500">Loading...</div>}
                {requests.map((r) => (
                  <div key={r.threadId} className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-emerald-500 text-white font-bold">
                            {(r.from?.firstName?.[0] || r.from?.email?.[0] || "U").toUpperCase()}
                          </div>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">
                            {`${r.from?.firstName ?? ""} ${r.from?.lastName ?? ""}`.trim() || r.from?.email}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-[220px]">{r.preview}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(r.threadId)}>Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReject(r.threadId)}>Reject</Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button variant="ghost" size="sm" onClick={() => selectRequest(r)}>View</Button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && !loading && (
                  <div className="p-4 text-sm text-gray-500">No pending requests</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="find" className="flex-1">
              <FindUsers onSelectUser={(u) => selectContact({ ...u, _id: u._id })} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col lg:w-auto w-full">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </Button>

                  <Avatar className="w-10 h-10">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {selectedContact.name?.[0]}
                    </div>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{selectedContact.name}</p>
                    <p className="text-sm text-gray-500">
                      {selectedContact.online ? (
                        <span className="text-green-500">Online</span>
                      ) : (
                        "Last seen recently"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Pending request banner */}
            {selectedContact?.isRequest && (
              <div className="px-4 py-2 bg-amber-50 text-amber-800 border-b border-amber-200">
                This is a message request. Accept to start chatting.
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => handleAccept(selectedContact.threadId)}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(selectedContact.threadId)}>Reject</Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💬</span>
                    </div>
                    <p className="text-lg font-medium mb-2">No messages yet</p>
                    <p className="text-sm">Start a conversation with {selectedContact.name}</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.sender._id === userInfo.id;
                  return (
                    <div
                      key={message._id || index}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} message-bubble`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex justify-start animate-fadeInUp">
                  <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 border border-gray-200 dark:border-gray-600 shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button variant="ghost" size="sm" type="button">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-12 bg-gray-50 dark:bg-gray-700 border-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          // No chat selected
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaUserCircle className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-4">
                Choose from your existing conversations or start a new one
              </p>
              {/* Mobile: Show button to open sidebar */}
              <Button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Menu className="w-4 h-4 mr-2" />
                Open Conversations
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;