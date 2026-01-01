import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../../constant/url";

const MessagePage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(false);

  // ⭐ 1) Fetch message users list (conversation users)
  const {
    data: messageUsers,
    isLoading: loadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ["messageUsers"],
    queryFn: async () => {
      const res = await fetch(`${baseUrl}/api/message/messageUser`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
  });

  // ⭐ 2) Search users API
  const {
    data: searchData,
    isLoading: searchLoading,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["searchUsers", searchValue || "random"],
    queryFn: async () => {
      const url = searchValue.trim()
        ? `${baseUrl}/api/users/search/${encodeURIComponent(searchValue.trim())}`
        : `${baseUrl}/api/users/search`;

      const res = await fetch(url, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return data;
    },
    enabled: showResults,
  });

  // ⭐ 3) run search automatically
  useEffect(() => {
    const trimmed = searchValue.trim();

    if (!trimmed) {
      setShowResults(false);
      refetchMessages();   // show conversation users again
      return;
    }

    setShowResults(true);
    refetchSearch();
  }, [searchValue, refetchMessages, refetchSearch]);

  const list = showResults ? searchData : messageUsers;
  const isLoading = showResults ? searchLoading : loadingMessages;

  return (
    <div className="flex-[4_4_0] mx-auto min-h-screen border-r border-gray-700 w-full">

      {/* Search Box */}
      <div className="p-3 border-b border-gray-700 flex gap-2">
        <input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search users…"
          className="w-full rounded-full px-4 py-2 bg-gray-800"
        />
      </div>

      {/* List */}
      <div className="p-3 flex flex-col gap-4">
        {isLoading && <p>Loading…</p>}

        {!isLoading && (!list || list.length === 0) && (
          <p className="text-center text-gray-400 mt-6">No users found.</p>
        )}

        {!isLoading &&
          list?.map((user) => (
        <Link
  to={`/messages/${user.username}`}
  state={{
    fullName: user.fullName,
    profileImg: user.profileImg || "/avatar-placeholder.png",
  }}
  key={user.userId || user._id}
  className="flex gap-3 items-center border-b border-gray-800 pb-3"
>
              <img
                src={user.profileImg || "/avatar-placeholder.png"}
                className="w-10 h-10 rounded-full"
                alt="profile"
              />
              <div>
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default MessagePage;
