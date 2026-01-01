import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baseUrl } from "../../constant/url";
import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const FollowPage = () => {
  const { id, type } = useParams();   // type = following | follower
  const { follow, isPending } = useFollow();
  const { data: authUser } = useQuery({ queryKey: ["authUser"]});



// FOLLOWING query
const {
  data: followingData,
  isLoading: loadingFollowing,
} = useQuery({
  queryKey: ["followingList", id, "following"],
  queryFn: async () => {
    const res = await fetch(`${baseUrl}/api/users/${id}/following`, {
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  },
  enabled: type === "following",
});

// FOLLOWERS query
const {
  data: followerData,
  isLoading: loadingFollower,
} = useQuery({
  queryKey: ["followerList"],
  queryFn: async () => {
    const res = await fetch(`${baseUrl}/api/users/${id}/follower`, {
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    return data;
  },
  enabled: type === "follower",
});

// choose which one to use
const data   = type === "following" ? followingData : followerData;
const isLoading = type === "following" ? loadingFollowing : loadingFollower;


  return (
    <div className="flex-[4_4_0] mx-auto min-h-screen border-r border-gray-700 w-full">
      
      {/* Tabs */}
      <div className="flex w-full border-b border-gray-700">
        <Link
          to={`/users/${id}/following`}
          className="flex justify-center flex-1 p-3 hover:bg-secondary relative"
        >
          Following
          {type === "following" && (
            <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
          )}
        </Link>

        <Link
          to={`/users/${id}/follower`}
          className="flex justify-center flex-1 p-3 hover:bg-secondary relative"
        >
          Followers
          {type === "follower" && (
            <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary"></div>
          )}
        </Link>
      </div>

      {/* List */}
      <div className="p-3 flex flex-col gap-4">
        {isLoading && <div>Loading…</div>}

        {!isLoading && data?.length === 0 && (
          <p className="text-center text-gray-400 mt-6">
            No users here.
          </p>
        )}

        {!isLoading &&
          data?.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-3 border-b border-gray-800 pb-3"
            >
              <Link
                to={`/profile/${user.username}`}
                className="flex gap-3 items-center flex-1"
              >
                <img
                  src={user.profileImg || "/avatar-placeholder.png"} alt="prfoileImg"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-semibold">{user.fullName}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </Link>

              {/* always unfollow */}
              {user._id !== authUser._id && (
                <button
                  onClick={() => follow(user._id)}
                  className="btn bg-gray-700 text-white rounded-full btn-sm px-4"
                >
                  {isPending ? <LoadingSpinner />:
                  user.isFollower ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default FollowPage;
