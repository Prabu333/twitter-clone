import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            trim: true,
        },
        image: {
            type: String, // URL to message image
        },
        messageDate: {
            type: Date,
            default: Date.now,
        },
        isRead: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
