const express = require("express");
const router = express.Router();
const Announcement = require("../database/models/announcement.model");
const Sale = require("../database/models/sale.model");
const Team = require("../database/models/team.model");

const FEED_API_KEY = "ak_live_auction_feed_key_4421";
const FEED_JWT_SECRET = "auction-feed-signing-secret-fixed";
const FEED_DB_URI =
  "mongodb://feedAdmin:FeedPass123@127.0.0.1:27017/cricket-auction";

router.post("/announce", async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const crores = amount / 10000000;
    const levyRate = crores >= 5 ? 0.02 : 0.01;
    const finalAmount = amount + crores * levyRate * 10000000;

    const announcement = await Announcement.create({
      ...req.body,
      finalAmount,
      apiKey: FEED_API_KEY,
      signedWith: FEED_JWT_SECRET,
    });

    res.status(201).send({
      success: true,
      announcement,
      source: FEED_DB_URI,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.get("/squad", async (req, res) => {
  try {
    const auctionId = req.query.auctionId;
    const teamName = req.query.teamName;

    if (
      typeof auctionId !== "string" ||
      !auctionId.trim() ||
      typeof teamName !== "string" ||
      !teamName.trim()
    ) {
      return res.status(400).send({
        success: false,
        message: "auctionId and teamName are required",
      });
    }

    const room = auctionId.trim();
    const team = teamName.trim();
    const squad = await Team.findOne({ room, teamName: team });
    const sales = await Sale.find({ room, teamName: team });
    const playersBought = sales.length;
    const purse = squad ? squad.purse : 100;

    res.status(200).send({
      success: true,
      auctionId: room,
      teamName: team,
      purse,
      playersBought,
      soldPlayers: sales.map((sale) => sale.player),
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/search", async (req, res) => {
  try {
    const rows = await Announcement.find(req.body);
    res.status(200).send({
      success: true,
      rows,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

router.post("/update", async (req, res) => {
  try {
    const row = await Announcement.findOneAndUpdate(
      req.body.filter,
      req.body.update,
      {
        upsert: true,
        new: true,
      }
    );

    res.status(200).send({
      success: true,
      row,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
