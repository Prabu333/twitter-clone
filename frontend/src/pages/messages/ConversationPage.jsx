import { useState, useRef, useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IoSend, IoClose, IoCheckmarkDone, IoRefresh } from "react-icons/io5";
import { baseUrl } from "../../constant/url";

const ConversationPage = () => {
  const { username } = useParams();
  const location = useLocation();
  const { fullName, profileImg } = location.state || {};


  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  // Fetch messages
  const { data, isLoading, error, refetch: refetchMessages } = useQuery({
    queryKey: ["conversation", username, refetchTrigger],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/message/conversation/${username}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
  });

  // Convert file to base64
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  // Send message (text + optional image)
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, image }) => {
      const payload = {
        text,
        to: username,
        image: image || null, // base64 string
      };

      const res = await fetch(`${baseUrl}/api/message/sentmessage`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    onSuccess: () => {
      setText("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["conversation", username] });
    },
    onError: (error) => {
      console.error("Send message failed:", error);
      alert(`Failed to send: ${error.message}`);
    },
  });

  // Handle send
  const handleSend = async () => {
    if (!text && !file) return;

    let imageBase64 = null;
    if (file) {
      imageBase64 = await convertToBase64(file);
    }

    sendMessageMutation.mutate({ text, image: imageBase64 });
  };

  const handleRetry = () => {
    refetchMessages();
    setRefetchTrigger((prev) => prev + 1);
  };

  // Flatten messages with dateHeader and sort by time
  const messages = useMemo(() => {
    if (!data?.messages) return [];

    let all = data.messages.flatMap((day) =>
      day.messages.map((msg) => ({ ...msg, dateHeader: day.date }))
    );

    // Sort by date + time
    all.sort((a, b) => {
      const dateA = new Date(`${a.dateHeader} ${a.time}`);
      const dateB = new Date(`${b.dateHeader} ${b.time}`);
      return dateA - dateB;
    });

    return all;
  }, [data]);

  // Unique date headers for grouping
  const dateHeaders = useMemo(() => {
    const dates = [...new Set(messages.map((msg) => msg.dateHeader))];
    return dates.map((date) => ({
      date,
      unreadCount: messages.filter((msg) => msg.dateHeader === date && !msg.isRead)
        .length,
    }));
  }, [messages]);

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  // Message bubble component
const MessageBubble = ({ msg }) => (
  <div className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}>
    <div
      className={`max-w-[85%] sm:max-w-sm px-3 py-2.5 rounded-2xl text-sm sm:text-base break-words shadow-sm ${
        msg.isFromMe
          ? "bg-gradient-to-r from-primary to-primary/80 rounded-br-sm"
          : "bg-gray-700/80 rounded-bl-sm"
      }`}
    >
      {msg.text && <div>{msg.text}</div>}
      {msg.image && (
        <img
          src={msg.image}
          alt="attachment"
          className="mt-2 rounded-xl max-h-72 object-cover"
        />
      )}
      <div
        className={`text-xs mt-1 flex items-center gap-1 px-1 py-0.5 rounded ${
          msg.isFromMe
            ? "justify-end text-white/90 bg-black/10"
            : "justify-start text-gray-200 bg-black/20"
        }`}
      >
        <span>{msg.time}</span>
        {msg.isFromMe && <IoCheckmarkDone className="w-3 h-3" />}
      </div>
    </div>
  </div>
);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, text, file]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-dvh w-full bg-gray-900 text-white">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
          <img
            src={profileImg || "/avatar-placeholder.png"}
            alt={fullName}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="truncate min-w-0 flex-1">
            <p className="font-semibold truncate text-sm sm:text-base">{fullName}</p>
            <p className="text-xs sm:text-sm text-gray-400 truncate">@{username}</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2"></div>
          Loading messages...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-full bg-gray-900 text-white overflow-hidden">
      {/* Top bar */}
      <Link to={`/profile/${username}`}>
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0 relative">
        <img
          src={profileImg || "/avatar-placeholder.png"}
          alt={fullName}
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
        />
        <div className="truncate min-w-0 flex-1">
          <p className="font-semibold truncate text-sm sm:text-base">{fullName}</p>
          <p className="text-xs sm:text-sm text-gray-400 truncate">@{username}</p>
        </div>
        {error && (
          <button
            onClick={handleRetry}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0 ml-2"
            title="Retry loading messages"
          >
            <IoRefresh className="w-5 h-5 text-yellow-400" />
          </button>
        )}
      </div>
      </Link>

      {/* Messages area */}
      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="text-4xl text-red-400 mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-200">Failed to load messages</h3>
          <p className="text-sm text-gray-500 max-w-md">{error.message}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg"
          >
            <IoRefresh className="w-4 h-4" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {dateHeaders.map((header) => (
            <div key={header.date}>
              <div className="flex justify-center my-6">
                <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-gray-300 border border-gray-700 shadow-lg">
                  {formatDateHeader(header.date)}
                  {header.unreadCount > 0 && (
                    <span className="ml-2 bg-primary text-black text-xs px-2.5 py-1 rounded-full font-semibold shadow-md">
                      {header.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {messages
                .filter((msg) => msg.dateHeader === header.date)
                .map((msg) => (
                  <MessageBubble key={msg._id} msg={msg} />
                ))}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
              No messages yet
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800">
        {file && (
          <div className="px-3 sm:px-4 py-3 border-b border-gray-700 bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                disabled={sendMessageMutation.isPending}
              >
                <IoClose className="w-4 h-4 text-gray-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        )}

        <div className="p-2 sm:p-3 flex gap-1 sm:gap-2 items-center flex-wrap">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-[200px] rounded-full px-3 py-2 bg-gray-700 text-white outline-none placeholder-gray-400 text-sm sm:text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sendMessageMutation.isPending}
          />

          <label
            htmlFor="file-upload"
            className={`cursor-pointer text-xs sm:text-sm text-gray-300 px-2 sm:px-3 py-2 rounded-full flex items-center justify-center bg-gray-800 border border-gray-600 transition-colors whitespace-nowrap flex-shrink-0 ${
              sendMessageMutation.isPending
                ? "opacity-50 cursor-not-allowed border-gray-700 bg-gray-800"
                : "hover:bg-gray-700 hover:border-gray-500"
            }`}
          >
            <span className="hidden sm:inline">Attach</span>
            <span className="sm:hidden">📎</span>
          </label>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            disabled={sendMessageMutation.isPending}
          />

          <button
            onClick={handleSend}
            disabled={sendMessageMutation.isPending}
            className="flex items-center gap-1 sm:gap-2 bg-primary hover:bg-primary/90 text-black font-semibold px-4 sm:px-5 py-2 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <IoSend className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
