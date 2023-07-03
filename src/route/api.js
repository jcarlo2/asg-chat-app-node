const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");

router.get("/logout", userController.logout);
router.get("/find-all-friends", userController.findAllFriends);
router.get("/find-profile", userController.findProfile);
router.get("/find-blocked-friend", userController.findBlockedFriends);
router.get("/find-friend-request", userController.findFriendRequest);
router.post("/profile-update", userController.userUpdate);
router.post("/search", userController.search);
router.post("/unblock-unfriend", userController.unblockAndUnfriend);
router.post("/block", userController.block);
router.post("/add", userController.add);
router.post("/accept", userController.accept);
router.post("/find-all-message", userController.findAllMessage);
router.get("/join-room", userController.joinRoom)

module.exports = router;
