
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";



export const sendMessage = async (req, res) => {
    try {
        const { text, to } = req.body;
        let { image } = req.body;
        const from = req.user._id.toString();

        // Validate sender
        const sender = await User.findById(from);
        if (!sender) return res.status(404).json({ message: "Sender not found" });

        // Validate recipient
            const recipient = await User.findOne({ username: to })
        if (!recipient) return res.status(404).json({ message: "Recipient not found" });

        // Validate message content
        if (!text && !image) {
            return res.status(400).json({ error: "Message must have text or image" });
        }

        // Handle image upload if provided
        if (image) {
            const uploadedResponse = await cloudinary.uploader.upload(image);
            image = uploadedResponse.secure_url;
        }

        // Create new message
        const newMessage = new Message({
            from,
          to: recipient._id,
            text,
            image,
        });

        await newMessage.save();


        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        console.log("Error in sendMessage controller: ", error);
    }
};

export const getMessageUser = async (req, res) => {
    try {
    const currentUserId = new mongoose.Types.ObjectId(req.user._id);


// 1️⃣ get conversations
const users = await Message.aggregate([
  {
    $match: {
      $or: [
        { from: currentUserId },
        { to: currentUserId }
      ]
    }
  },
  {
    $project: {
      otherUser: {
        $cond: [
          { $eq: ["$from", currentUserId] },
          "$to",
          "$from"
        ]
      }
    }
  },
  {
    $group: { _id: "$otherUser" }
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user"
    }
  },
  { $unwind: "$user" },
  {
    $project: {
      _id: 0,
      userId: "$user._id",
      fullName: "$user.fullName",
      username: "$user.username",
      profileImg: "$user.profileImg"
    }
  }
]);
console.log(users)

if (users.length > 0) {
  return res.status(200).json(users);
}

const currentUser = await User.findById(currentUserId)
  .select("followers following")
  .lean();

const people = await User.find({
  _id: { $in: [...currentUser.followers, ...currentUser.following] }
})
  .select("fullName username profileImg")
  .lean();

return res.status(200).json(people);

    } catch (error) {
        console.log(" Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};




export const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    const { username } = req.params; 


    const targetUser = await User.findOne({ username }).select(
      "_id username fullName profileImg"
    );

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetUserId = targetUser._id.toString();


    const messages = await Message.find({
      $or: [
        { from: currentUserId, to: targetUserId },
        { from: targetUserId, to: currentUserId },
      ],
    })
      .populate("from", "username fullName profileImg")
      .populate("to", "username fullName profileImg")
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    // 3️⃣ Group messages by DATE (ignore time)
    const grouped = {};

    messages.forEach((msg) => {
      const dateStr = new Date(msg.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD

      const isFromMe = msg.from._id.toString() === currentUserId;

      const time = new Date(msg.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!grouped[dateStr]) grouped[dateStr] = [];

      grouped[dateStr].push({
        _id: msg._id,
        text: msg.text,
        image: msg.image || null,
        isRead: msg.isRead,
        time,      // message time
        isFromMe,  // true if current user sent it
        from: msg.from,
        to: msg.to,
      });
    });

    const result = Object.keys(grouped).map((date) => ({
      date,
      messages: grouped[date],
    }));


    await Message.updateMany(
      { from: targetUserId, to: currentUserId, isRead: false },
      { isRead: true }
    );


    res.status(200).json({
      messages: result,
      targetUser: {
        userId: targetUserId,
        username: targetUser.username,
        fullName: targetUser.fullName,
        profileImg: targetUser.profileImg,
      },
    });
  } catch (error) {
    console.log("Error in getConversation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
