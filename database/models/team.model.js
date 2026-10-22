const mongoose = require("mongoose");
const { Schema } = mongoose;

const TeamSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.Mixed,
    },
    playerId: {
      type: Schema.Types.Mixed,
    },
    teamName: {
      type: String,
    },
    purse: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Team = mongoose.model("Team", TeamSchema);

module.exports = Team;
