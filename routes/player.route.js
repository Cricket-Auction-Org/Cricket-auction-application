const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  getPlayerCount,
} = require("../controller/player");

// All routes require authentication
router.get("/", auth, getPlayers);
router.post("/", auth, addPlayer);
router.put("/:id", auth, updatePlayer);
router.delete("/:id", auth, deletePlayer);
router.get("/count", auth, getPlayerCount);

module.exports = router;
