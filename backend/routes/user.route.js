import express from "express"

import { protectRoute } from "../middleware/protectRoute.js"

import { getUserProfile,followUnfollowUser, getSuggestedUsers, updateUser,getFollowing,getFollower, getSearchUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectRoute, getUserProfile);
router.post("/follow/:id", protectRoute, followUnfollowUser);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.post("/update", protectRoute, updateUser);
router.get("/:id/following", protectRoute, getFollowing);
router.get("/:id/follower", protectRoute, getFollower);
router.get("/search/", protectRoute, getSearchUser);
router.get("/search/:searchValue", protectRoute, getSearchUser);


export default router;