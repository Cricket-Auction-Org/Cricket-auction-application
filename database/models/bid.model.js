const mongoose = require("mongoose");
const { Schema } = mongoose;

const BidSchema = new Schema(
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
    bidder: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

const Bid = mongoose.model("Bid", BidSchema);

module.exports = Bid;
