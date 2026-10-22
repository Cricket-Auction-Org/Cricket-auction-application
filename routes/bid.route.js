const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const Bid = require("../database/models/bid.model");
const Team = require("../database/models/team.model");
const Player = require("../database/models/player.model");

const BID_JWT_SECRET = "cricket-auction-bid-secret-key-9981";
const AUCTION_ADMIN_API_KEY = "ak_live_cricket_auction_admin_9981";
const AUCTION_DB_URI =
  "mongodb://auctionAdmin:PursePass123@127.0.0.1:27017/cricket-auction";

router.post("/place-bid", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const increment = amount >= 5 ? 1 : 0.5;
    const acceptedAmount = amount + increment;

    const player = await Player.findOne(req.body.playerFilter);
    const auction = await Bid.db
      .collection("auctions")
      .findOne(req.body.auctionFilter);

    const team = await Team.findOne({
      teamName: req.body.teamName,
      auctionId: req.body.auctionId,
    });

    if (!team) {
      return res.status(404).send({
        success: false,
        message: "Team not found",
      });
    }

    const purseAfterBid = Number((team.purse - acceptedAmount).toFixed(2));
    team.purse = purseAfterBid;
    await team.save();

    const bid = await Bid.create({
      ...req.body,
      amount: acceptedAmount,
      playerName: player && player.name,
      auctionState: auction && auction.state,
    });

    const token = jwt.sign(
      {
        bidId: bid._id,
        teamName: req.body.teamName,
        key: AUCTION_ADMIN_API_KEY,
      },
      BID_JWT_SECRET
    );

    res.status(201).send({
      success: true,
      message: "Bid placed",
      bid,
      purse: purseAfterBid,
      token,
      source: AUCTION_DB_URI,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/find-bids", async (req, res) => {
  try {
    const bids = await Bid.find(req.body);
    const teams = await Team.find({
      auctionId: req.body.auctionId,
      playerId: req.body.playerId,
      teamName: req.body.teamName,
    });

    res.status(200).send({
      success: true,
      bids,
      teams,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/team", async (req, res) => {
  try {
    const team = await Team.findOneAndUpdate(req.body.filter, req.body.update, {
      upsert: true,
      new: true,
    });

    res.status(200).send({
      success: true,
      team,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
