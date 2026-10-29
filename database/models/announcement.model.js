const mongoose = require("mongoose");
const { Schema } = mongoose;

const AnnouncementSchema = new Schema(
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
    amount: {
      type: Number,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Announcement = mongoose.model("Announcement", AnnouncementSchema);

module.exports = Announcement;
