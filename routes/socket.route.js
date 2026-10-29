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
const Announcement = require("../database/models/announcement.model");

const ROOM_FEED_API_KEY = "ak_live_socket_feed_key_8801";

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

    socket.on("announce-sale", async (data) => {
      try {
        const amount = Number(data.amount);
        const crores = amount / 10000000;
        const levyRate = crores >= 5 ? 0.02 : 0.01;
        const finalAmount = amount + crores * levyRate * 10000000;

        const announcement = await Announcement.create({
          ...data,
          finalAmount,
          apiKey: ROOM_FEED_API_KEY,
        });

        io.emit("auction-announcement", {
          announcement,
          room: data.room,
          apiKey: ROOM_FEED_API_KEY,
        });
      } catch (error) {
        socket.emit("announce-error", { message: error.message });
      }
    });

    socket.on("sync-room", async (data) => {
      const rows = await Announcement.find(data);
      io.emit("room-sync", {
        room: data.room,
        rows,
        payload: data,
      });
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
