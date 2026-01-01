import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { baseUrl } from "../../constant/url";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchPage = () => {
  const [searchValue, setSearchValue] = useState("");
  const [showResults, setShowResults] = useState(true); // Start with true to show random users
  const { follow, isPending } = useFollow();
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  // Search query - handles both empty (random) and text search
  const {
    data: searchData,
    isLoading: searchLoading,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["searchUsers", searchValue || "random"], // Use "random" for initial load
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
    enabled: showResults, // Always enabled since we want initial random users
  });

  const handleSearch = () => {
    if (searchValue.trim()) {
      setShowResults(true);
      refetchSearch();
    }
  };

  const handleClear = () => {
    setSearchValue("");
    setShowResults(true); // Keep showing random users
    refetchSearch(); // Fetch random users again
  };

  return (
    <div className="flex-[4_4_0] mx-auto min-h-screen border-r border-gray-700 w-full flex flex-col">
      {/* Search Box */}
      <div className="p-4 border-b border-gray-700 sticky top-0 bg-black z-10">
        <div className="flex items-center gap-2 bg-gray-900 rounded-full px-4 py-2">
          <FaSearch className="w-5 h-5 text-gray-400" />
          
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search users..."
            className="bg-transparent flex-1 outline-none text-white placeholder-gray-500 px-2"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          
          {searchValue && (
            <button onClick={handleClear} className="p-1 hover:bg-gray-800 rounded-full">
              <FaTimes className="w-4 h-4 text-gray-400" />
            </button>
          )}
          
          {showResults && searchValue && (
            <button
              onClick={handleClear}
              className="text-sm text-gray-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 p-3 flex flex-col gap-4 overflow-y-auto">
        {searchLoading && <div className="text-center py-8">Loading users...</div>}

        {!searchLoading && showResults && searchData?.length === 0 && (
          <p className="text-center text-gray-400 mt-20">
            No users found for "{searchValue}"
          </p>
        )}

        {!searchLoading &&
          showResults &&
          searchData?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-3 border-b border-gray-800 pb-3"
            >
              <Link
                to={`/profile/${user.username}`}
                className="flex gap-3 items-center flex-1 hover:bg-secondary p-2 rounded-lg"
              >
                <img
                  src={user.profileImg || "/avatar-placeholder.png"}
                  alt="profileImg"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user.fullName}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  {user.isFollower && (
                    <p className="text-xs text-green-400">Following</p>
                  )}
                </div>
              </Link>

              {user._id !== authUser?._id && (
                <button
                  onClick={() => follow(user._id)}
                  className="btn bg-gray-700 text-white rounded-full btn-sm px-4 hover:bg-gray-600"
                  disabled={isPending}
                >
                  {isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : user.isFollower ? (
                    "UnFollow"
                  ) : (
                    "Follow"
                  )}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default SearchPage;
