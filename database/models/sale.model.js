const mongoose = require("mongoose");
const { Schema } = mongoose;

const SaleSchema = new Schema(
  {
    room: {
      type: String,
    },
    player: {
      type: Schema.Types.Mixed,
    },
    teamName: {
      type: String,
    },
    amount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model("Sale", SaleSchema);

module.exports = Sale;
