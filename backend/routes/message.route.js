import express from "express"

import { protectRoute } from "../middleware/protectRoute.js"

import { sendMessage,getMessageUser, getConversation } from "../controllers/message.controller.js";

const router = express.Router();


router.post("/sentmessage", protectRoute, sendMessage);

router.get("/messageUser", protectRoute, getMessageUser);

router.get("/conversation/:username", protectRoute, getConversation);





export default router;