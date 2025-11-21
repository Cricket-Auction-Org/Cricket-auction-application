const Player = require("../database/models/player.model");
const User = require("../database/models/user.model");

// Get all players for the authenticated user
const getPlayers = async (req, res) => {
  try {
    const players = await Player.find({ owner: req.id }).sort({
      createdAt: -1,
    });
    res.status(200).send({
      success: true,
      players,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching players",
      error: error.message,
    });
  }
};

// Add a new player
const addPlayer = async (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role) {
      return res.status(400).send({
        success: false,
        message: "Player name and role are required",
      });
    }

    // Validate role
    const validRoles = ["batter", "bowler", "allrounder", "wicketkeeper"];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).send({
        success: false,
        message:
          "Invalid role. Must be: batter, bowler, allrounder, or wicketkeeper",
      });
    }

    // Check if player with same name already exists for this user
    // Note: Different users can have players with the same name
    const existingPlayer = await Player.findOne({
      name: name.trim(),
      owner: req.id,
    });

    if (existingPlayer) {
      return res.status(400).send({
        success: false,
        message: "You already have a player with this name",
      });
    }

    const player = new Player({
      name: name.trim(),
      role: role.toLowerCase(),
      owner: req.id,
    });

    await player.save();

    res.status(201).send({
      success: true,
      message: "Player added successfully",
      player,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "You already have a player with this name",
      });
    }
    res.status(500).send({
      success: false,
      message: "Error adding player",
      error: error.message,
    });
  }
};

// Update a player
const updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const player = await Player.findOne({ _id: id, owner: req.id });

    if (!player) {
      return res.status(404).send({
        success: false,
        message: "Player not found",
      });
    }

    // If updating name, check for duplicate within current user's players
    // Note: Different users can have players with the same name
    if (name && name.trim() !== player.name) {
      const existingPlayer = await Player.findOne({
        name: name.trim(),
        owner: req.id,
        _id: { $ne: id }, // Exclude the current player being updated
      });

      if (existingPlayer) {
        return res.status(400).send({
          success: false,
          message: "You already have a player with this name",
        });
      }
      player.name = name.trim();
    }
    if (role) {
      const validRoles = ["batter", "bowler", "allrounder", "wicketkeeper"];
      if (!validRoles.includes(role.toLowerCase())) {
        return res.status(400).send({
          success: false,
          message:
            "Invalid role. Must be: batter, bowler, allrounder, or wicketkeeper",
        });
      }
      player.role = role.toLowerCase();
    }

    await player.save();

    res.status(200).send({
      success: true,
      message: "Player updated successfully",
      player,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({
        success: false,
        message: "You already have a player with this name",
      });
    }
    res.status(500).send({
      success: false,
      message: "Error updating player",
      error: error.message,
    });
  }
};

// Delete a player
const deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;

    const player = await Player.findOneAndDelete({ _id: id, owner: req.id });

    if (!player) {
      return res.status(404).send({
        success: false,
        message: "Player not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Player deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error deleting player",
      error: error.message,
    });
  }
};

// Get player count for user
const getPlayerCount = async (req, res) => {
  try {
    const count = await Player.countDocuments({ owner: req.id });
    res.status(200).send({
      success: true,
      count,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error fetching player count",
      error: error.message,
    });
  }
};

module.exports = {
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
  getPlayerCount,
};
