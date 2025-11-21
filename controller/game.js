const Auction = require("./auction");
const Player = require("../database/models/player.model");
const User = require("../database/models/user.model");

const liveAuctions = new Map();

// Helper function to fetch all players for users in an auction
const fetchPlayersForAuction = async (usernames) => {
  try {
    // Get user IDs from usernames
    const users = await User.find({ username: { $in: usernames } }).select(
      "_id username"
    );
    const userIds = users.map((u) => u._id);

    // Fetch all players for these users
    const players = await Player.find({ owner: { $in: userIds } });

    // Format players to match expected structure
    return players.map((player) => ({
      _id: player._id,
      name: player.name,
      role: player.role,
      owner: player.owner,
      stats: {
        role: player.role.charAt(0).toUpperCase() + player.role.slice(1),
      },
    }));
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
};

// Called while creating a game
const create = async (io, socket, data) => {
  try {
    // Check if user has players
    const userDoc = await User.findOne({ username: data.username });
    if (!userDoc) {
      return socket.emit("create-error", {
        message: "User not found.",
      });
    }

    const playerCount = await Player.countDocuments({ owner: userDoc._id });
    if (playerCount === 0) {
      return socket.emit("create-error", {
        message:
          "You need to add players before creating an auction. Please go to Players page to add players.",
      });
    }

    socket.join(data.room);
    const auction = new Auction(io.to(data.room));
    auction.creator = data.username; // Set the creator
    auction.addUser(data.username);
    liveAuctions.set(data.room, auction);
    socket.emit("create-success", {
      room: data.room,
    });
    io.to(data.room).emit("users", {
      users: auction.users,
    });

    // Send players preview
    sendPlayersPreview(socket, data.room);
  } catch (error) {
    console.error("Error creating auction:", error);
    socket.emit("create-error", {
      message: "Error creating auction. Please try again.",
    });
  }
};

// Called while joining a game
const join = (io, socket, data) => {
  const auction = liveAuctions.get(data.room);
  if (!auction) {
    return socket.emit("join-result", {
      success: false,
      error: "Room does not exist!!",
    });
  }
  auction.addUser(data.username);
  socket.join(data.room);
  socket.emit("join-result", {
    success: true,
    room: data.room,
    error: "",
    isViewer: false,
  });
  io.to(data.room).emit("users", {
    users: auction.users,
  });

  // Send players preview if available
  sendPlayersPreview(socket, data.room);
};

// Called while viewing a game (view-only mode)
const viewAuction = (io, socket, data) => {
  const auction = liveAuctions.get(data.room);
  if (!auction) {
    return socket.emit("view-result", {
      success: false,
      error: "Room does not exist!!",
    });
  }
  auction.addViewer(data.username);
  socket.join(data.room);
  // Emit current state to viewer (similar to existing-user)
  socket.emit("existing-user", {
    room: data.room,
    users: auction.fetchPlayers(),
    initial: auction.getCurrentPlayer(),
    started: auction.getStatus(),
    isViewer: true,
    starter: false, // Viewers can't start auctions
  });

  // Send players preview if available
  sendPlayersPreview(socket, data.room);
};

const start = async (io, data) => {
  const auction = liveAuctions.get(data.room);
  if (!auction) {
    return;
  }

  // Only check and use creator's players
  const creatorUsername = auction.creator;
  if (!creatorUsername) {
    return io.to(data.room).emit("start-error", {
      message: "Auction creator not found.",
    });
  }

  const creatorDoc = await User.findOne({ username: creatorUsername }).select(
    "_id username"
  );
  if (!creatorDoc) {
    return io.to(data.room).emit("start-error", {
      message: "Auction creator not found.",
    });
  }

  const playerCount = await Player.countDocuments({ owner: creatorDoc._id });
  if (playerCount === 0) {
    return io.to(data.room).emit("start-error", {
      message:
        "Creator has no players. Please add players before starting the auction.",
    });
  }

  // Fetch only creator's players for the auction
  const players = await Player.find({ owner: creatorDoc._id });

  if (players.length === 0) {
    return io.to(data.room).emit("start-error", {
      message:
        "No players found. Please add players before starting the auction.",
    });
  }

  // Format players to match expected structure
  const formattedPlayers = players.map((player) => ({
    _id: player._id,
    name: player.name,
    role: player.role,
    owner: player.owner,
    stats: {
      role: player.role.charAt(0).toUpperCase() + player.role.slice(1),
    },
  }));

  // Shuffle players randomly
  const shuffledPlayers = formattedPlayers.sort(() => Math.random() - 0.5);
  auction.setPlayers(shuffledPlayers);

  // Emit players preview update to all in room
  io.to(data.room).emit("players-preview", {
    players: shuffledPlayers,
  });

  // Start the auction game
  auction.startAuction();
  auction.servePlayer();
  auction.startInterval();

  io.to(data.room).emit("start");
};

const play = (data) => {
  const auction = liveAuctions.get(data.room);
  if (!auction) {
    console.error("Auction not found for room:", data.room);
    return;
  }
  auction.startAuction();
  auction.servePlayer();
  auction.startInterval();
};

const bid = (socket, data) => {
  const auction = liveAuctions.get(data.room);
  auction.bid(socket, data.user);
  auction.displayBidder();
};

const next = (io, data) => {
  const auction = liveAuctions.get(data.room);
  auction.next(liveAuctions, data.room, data.user);
};

const checkUser = (socket, user) => {
  let toBeFound;
  let isViewer = false;
  let room;

  for (let [key, value] of liveAuctions) {
    const find = value.findUser(user.username);
    if (find) {
      toBeFound = find;
      room = key;
      isViewer = false;
      break;
    } else if (value.isViewer(user.username)) {
      toBeFound = { user: user.username };
      room = key;
      isViewer = true;
      break;
    }
  }

  if (toBeFound) {
    socket.join(room);
    socket.emit("existing-user", {
      room: room,
      users: liveAuctions.get(room).fetchPlayers(),
      initial: liveAuctions.get(room).getCurrentPlayer(),
      started: liveAuctions.get(room).getStatus(),
      isViewer: isViewer,
    });
    // Send players preview
    sendPlayersPreview(socket, room);
  } else {
    socket.emit("no-existing-user");
  }
};

const serverUsers = (io, room) => {
  const auction = liveAuctions.get(room);
  if (!auction) {
    return;
  }
  io.to(room).emit("users", {
    users: auction.users,
  });
};

// Send players preview to socket
const sendPlayersPreview = async (socket, room) => {
  const auction = liveAuctions.get(room);
  if (!auction) {
    return;
  }

  // If players are already set (auction started), send them
  if (auction.players && auction.players.length > 0) {
    socket.emit("players-preview", {
      players: auction.getPlayersPreview(),
    });
    return;
  }

  // If auction hasn't started, fetch creator's players for preview
  const creatorUsername = auction.creator;
  if (!creatorUsername) {
    return;
  }

  try {
    const creatorDoc = await User.findOne({ username: creatorUsername }).select(
      "_id username"
    );
    if (!creatorDoc) {
      return;
    }

    const players = await Player.find({ owner: creatorDoc._id });
    const formattedPlayers = players.map((player) => ({
      _id: player._id,
      name: player.name,
      role: player.role,
      owner: player.owner,
      stats: {
        role: player.role.charAt(0).toUpperCase() + player.role.slice(1),
      },
    }));

    socket.emit("players-preview", {
      players: formattedPlayers,
    });
  } catch (error) {
    console.error("Error fetching players preview:", error);
  }
};

const exitUser = (io, data) => {
  const auction = liveAuctions.get(data.room);
  if (!auction) {
    return;
  }
  if (auction.isParticipant(data.user)) {
    auction.removeUser(data.user);
  } else if (auction.isViewer(data.user)) {
    auction.removeViewer(data.user);
  }
  if (auction.users.length === 0 && auction.viewers.length === 0) {
    liveAuctions.delete(data.room);
  } else {
    serverUsers(io, data.room);
  }
};

const fetchDetails = (socket, data) => {
  let room = null;

  // First, try to get room from data if provided
  if (data && data.room) {
    room = data.room;
  }

  // If room not found, try to get it from socket rooms
  if (!room && socket.rooms) {
    for (let roomKey of socket.rooms) {
      if (liveAuctions.has(roomKey) && roomKey !== socket.id) {
        room = roomKey;
        break;
      }
    }
  }

  // If still not found, try to find by user
  if (!room && data?.user) {
    for (let [roomKey, auction] of liveAuctions) {
      if (auction.isParticipant(data.user) || auction.isViewer(data.user)) {
        room = roomKey;
        break;
      }
    }
  }

  if (!room) {
    return socket.emit("server-details", {
      bidder: "",
      amount: 0,
      player: null,
    });
  }

  const auction = liveAuctions.get(room);
  if (!auction) {
    return socket.emit("server-details", {
      bidder: "",
      amount: 0,
      player: null,
    });
  }

  const currentBid = auction.getCurrentBid();
  const currentPlayer = auction.getCurrentPlayer();

  socket.emit("server-details", {
    bidder: currentBid.bidder || "",
    amount: currentBid.bid || 0,
    player: currentPlayer || null,
  });
};

module.exports = {
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
};
