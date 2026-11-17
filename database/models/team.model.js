const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamSchema = new Schema(
  {
    room: {
      type: String,
    },
    teamName: {
      type: String,
    },
    purse: {
      type: Number,
      default: 100,
    },
    players: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Team = mongoose.model("Team", TeamSchema);

module.exports = Team;
