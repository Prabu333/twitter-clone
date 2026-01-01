import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import cloudinary from "cloudinary"
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username }).select("-password");
		if (!user) return res.status(404).json({ message: "User not found" });

		res.status(200).json(user);
	} catch (error) {
		console.log("Error in getUserProfile: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const followUnfollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		if (id === req.user._id.toString()) {
			return res.status(400).json({ error: "You can't follow/unfollow yourself" });
		}

		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow the user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

			res.status(200).json({ message: "User unfollowed successfully",id:null });
		} else {
			// Follow the user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			//Send notification to the user
			const newNotification = new Notification({
				type:  isFollowing ? "Unfollow" : "Follow",
				from: req.user._id,
				to: userToModify._id,
			});

			await newNotification.save();

			res.status(200).json({ message: "User followed successfully",id:id });
		}
	} catch (error) {
		console.log("Error in followUnfollowUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getSuggestedUsers = async (req, res) => {
	try {
		const userId = req.user._id;

		const usersFollowedByMe = await User.findById(userId).select("following");

		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{ $sample: { size: 10 } },
		]);

		// 1,2,3,4,5,6,
		const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0, 4);

		suggestedUsers.forEach((user) => (user.password = null));

		res.status(200).json(suggestedUsers);
	} catch (error) {
		console.log("Error in getSuggestedUsers: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const updateUser = async (req, res) => {
	const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
	let { profileImg, coverImg } = req.body;

	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(404).json({ message: "User not found" });

		if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
			return res.status(400).json({ error: "Please provide both current password and new password" });
		}

		if (currentPassword && newPassword) {
			const isMatch = await bcrypt.compare(currentPassword, user.password);
			if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
			if (newPassword.length < 6) {
				return res.status(400).json({ error: "Password must be at least 6 characters long" });
			}

			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(newPassword, salt);
		}

		if (profileImg) {
			if (user.profileImg) {
				// https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
				await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(profileImg);
			profileImg = uploadedResponse.secure_url;
		}

		if (coverImg) {
			if (user.coverImg) {
				await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
			}

			const uploadedResponse = await cloudinary.uploader.upload(coverImg);
			coverImg = uploadedResponse.secure_url;
		}

		user.fullName = fullName || user.fullName;
		user.email = email || user.email;
		user.username = username || user.username;
		user.bio = bio || user.bio;
		user.link = link || user.link;
		user.profileImg = profileImg || user.profileImg;
		user.coverImg = coverImg || user.coverImg;

		user = await user.save();

		// password should be null in response
		user.password = null;

		return res.status(200).json(user);
	} catch (error) {
		console.log("Error in updateUser: ", error.message);
		res.status(500).json({ error: error.message });
	}
};

export const getFollowing = async (req, res) => {
  try {
   const userId = req.user._id.toString();
const { id } = req.params;

// get the profile user + their following list
const user = await User.findById(id)
  .select("following")
  .populate("following", "username fullName profileImg following");

// Logged-in user following list
let myFollowingIds = [];

if (userId !== id) {
  const me = await User.findById(userId).select("following");
  myFollowingIds = me.following.map(f => f.toString());
}

const folloingsWithFlag = user.following.map(f => ({
  _id: f._id,
  username: f.username,
  fullName: f.fullName,
  profileImg: f.profileImg,

  // CASE 1: same user → always true
  // CASE 2: otherwise check whether BOTH follow same user
  isFollower:
    userId === id
      ? true
      : myFollowingIds.includes(f._id.toString())
}));


    res.status(200).json(folloingsWithFlag);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFollower = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
const { id } = req.params;

// get profile user with followers
const user = await User.findById(id)
  .select("followers")
  .populate("followers", "username fullName profileImg");

if (!user) {
  return res.status(404).json({ message: "User not found" });
}

// if viewing someone else's profile, get MY following list
let myFollowingIds = [];


  const me = await User.findById(loggedInUserId).select("following");
  myFollowingIds = me.following.map(f => f.toString());


const followersWithFlag = user.followers.map(f => ({
  _id: f._id,
  username: f.username,
  fullName: f.fullName,
  profileImg: f.profileImg,

  // CASE 1 → same user: always true
  // CASE 2 → check if I (logged in user) follow this person
  isFollower:
     myFollowingIds.includes(f._id.toString())
}));


return res.json(followersWithFlag);

    res.status(200).json(followersWithFlag);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSearchUser = async (req, res) => {
  try {
    const loggedInUserId = req.user._id.toString();
    const { searchValue } = req.params; // undefined for /search route

    // Get my following list
    const me = await User.findById(loggedInUserId).select("following");
    const myFollowingIds = me.following.map(f => f.toString());

    // CASE 1: No searchValue OR empty → 5 random users
    const isEmptySearch = !searchValue || 
                         (typeof searchValue === "string" && searchValue.trim() === "");
    
    if (isEmptySearch) {
      const randomUsers = await User.aggregate([
        { $match: { _id: { $ne: loggedInUserId } } },
        { $sample: { size: 5 } },
        {
          $project: {
            _id: 1,
            username: 1,
            fullName: 1,
            profileImg: 1
          }
        }
      ]);

      const withFlag = randomUsers.map(u => ({
        ...u,
        isFollower: myFollowingIds.includes(u._id.toString())
      }));

      return res.status(200).json(withFlag);
    }

    // CASE 2: Text search ONLY (string value)
    const searchTerm = searchValue.trim();
    
    const users = await User.find({
      _id: { $ne: loggedInUserId },
      $or: [
        { username: { $regex: searchTerm, $options: "i" } },
        { fullName: { $regex: searchTerm, $options: "i" } }
      ]
    })
      .select("username fullName profileImg")
      .limit(5);

    const withFlag = users.map(u => ({
      ...u._doc,
      isFollower: myFollowingIds.includes(u._id.toString())
    }));

    return res.status(200).json(withFlag);

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
