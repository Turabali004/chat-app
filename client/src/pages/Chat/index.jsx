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

// store
import { useAppStore } from "../../store";
import { getColor } from "../../../lib/utils";

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
  const messagesEndRef = useRef(null);
  
  // Mock contacts - in real app, fetch from API
  const [contacts] = useState([
    { id: 1, name: "John Doe", lastMessage: "Hey there!", time: "2m", online: true, unread: 2 },
    { id: 2, name: "Jane Smith", lastMessage: "How are you?", time: "1h", online: false, unread: 0 },
    { id: 3, name: "Mike Johnson", lastMessage: "See you later", time: "3h", online: true, unread: 1 },
    { id: 4, name: "Sarah Wilson", lastMessage: "Thanks!", time: "1d", online: false, unread: 0 },
  ]);

  useEffect(() => {
    if (!userInfo.profileSetup) {
      toast("Please setup profile to continue.");
      navigate("/profile");
      return;
    }

    // Initialize socket connection
    const token = sessionStorage.getItem("token");
    if (token) {
      const newSocket = io("http://localhost:5000", {
        auth: { token }
      });

      newSocket.on("connect", () => {
        console.log("Connected to server");
        setSocket(newSocket);
      });

      newSocket.on("message", (message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on("typing", ({ userId, isTyping }) => {
        setIsTyping(isTyping);
      });

      newSocket.on("user_status", ({ userId, status }) => {
        // Update online users
        setOnlineUsers(prev => 
          status === "online" 
            ? [...prev, userId]
            : prev.filter(id => id !== userId)
        );
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact || !socket) return;

    const messageData = {
      receiver: selectedContact.id,
      content: newMessage.trim()
    };

    socket.emit("message", messageData);
    
    // Add message to local state optimistically
    const tempMessage = {
      _id: Date.now(),
      sender: { _id: userInfo.id, username: userInfo.firstName + " " + userInfo.lastName },
      receiver: { _id: selectedContact.id, username: selectedContact.name },
      content: newMessage.trim(),
      createdAt: new Date()
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    if (socket) socket.disconnect();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
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
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-none"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contacts.map((contact, index) => (
            <div
              key={contact.id}
              onClick={() => {
                setSelectedContact(contact);
                setIsMobileSidebarOpen(false); // Close sidebar on mobile when contact is selected
              }}
              className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 animate-fadeInUp ${
                selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {contact.name[0]}
                    </div>
                  </Avatar>
                  {contact.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse-slow"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-800 dark:text-white truncate">
                      {contact.name}
                    </p>
                    <span className="text-xs text-gray-500">{contact.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                    {contact.unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
                      {selectedContact.name[0]}
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
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} message-bubble`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-sm border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
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
