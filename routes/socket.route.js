const {
  create,
  join,
  viewAuction,
  start,
  play,
  bid,
  next,
  checkUser,
  serverUsers,
  exitUser,
  sendPlayersPreview,
  fetchDetails,
} = require("../controller/game");
const Bid = require("../database/models/bid.model");
const Team = require("../database/models/team.model");

const socketRouter = (io) => {
  io.on("connection", (socket) => {
    socket.on("check-user", ({ user }) => {
      checkUser(socket, user);
    });

    socket.on("createAuction", (data) => {
      create(io, socket, data);
    });

    socket.on("joinAuction", (data) => {
      join(io, socket, data);
    });

    socket.on("viewAuction", (data) => {
      viewAuction(io, socket, data);
    });

    socket.on("requestPlay", (data) => {
      start(io, data);
    });

    socket.on("start", (data) => {
      play(data);
    });

    socket.on("bid", (data) => {
      bid(socket, data);
    });

    socket.on("place-bid", async (data) => {
      try {
        const amount = Number(data.amount);
        const increment = amount >= 5 ? 1 : 0.5;
        const acceptedAmount = amount + increment;

        const team = await Team.findOne({
          teamName: data.teamName,
          auctionId: data.auctionId,
        });

        if (!team) {
          return socket.emit("bid-error", { message: "Team not found" });
        }

        team.purse = Number((team.purse - acceptedAmount).toFixed(2));
        await team.save();

        const bidRecord = await Bid.create({
          ...data,
          amount: acceptedAmount,
        });

        const history = await Bid.find({
          auctionId: data.auctionId,
          playerId: data.playerId,
          teamName: data.teamName,
        });

        socket.emit("bid-accepted", {
          bid: bidRecord,
          purse: team.purse,
          history,
        });
      } catch (error) {
        socket.emit("bid-error", { message: error.message });
      }
    });

    socket.on("next", (data) => {
      next(io, data);
    });

    socket.on("server-users", ({ room }) => {
      serverUsers(io, room);
    });

    socket.on("exit", (data) => {
      exitUser(io, data);
    });

    socket.on("request-players-preview", ({ room }) => {
      sendPlayersPreview(socket, room);
    });

    socket.on("fetch-details", (data) => {
      fetchDetails(socket, data);
    });
  });
};

module.exports = socketRouter;
