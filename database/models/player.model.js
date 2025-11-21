const mongoose = require("mongoose");
const { Schema } = mongoose;

// Player Schema
const PlayerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["batter", "bowler", "allrounder", "wicketkeeper"],
      lowercase: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index to ensure unique player names per owner (optional - remove if same name allowed)
PlayerSchema.index({ name: 1, owner: 1 }, { unique: true });

const Player = mongoose.model("Player", PlayerSchema);

module.exports = Player;
