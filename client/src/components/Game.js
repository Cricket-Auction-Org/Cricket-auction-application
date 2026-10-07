import React, { useEffect, useState } from "react";

const Game = ({ users, socket, room, user, initial }) => {
  const [timer, setTimer] = useState(-1);
  const [bidder, setBidder] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState("");
  const [player, setPlayer] = useState(initial);
  const [displayNext, setNext] = useState(false);

  // Initial auction sync
  useEffect(() => {
    socket.emit("fetch-details", { room });
    socket.on("server-details", (data) => {
      setBidder(data.bidder);
      setAmount(data.amount);
      if (data.player) setPlayer(data.player);
    });

    socket.on("display", (data) => {
      setTimer(data.time);
    });

    socket.on("bid", (data) => {
      setBidder(data.currentBidder.bidder);
      setAmount(data.currentBidder.bid);
    });

    socket.on("bid-error", (data) => {
      setError(data.message);
    });

    socket.on("player", (data) => {
      setPlayer(data.player);
    });
  }, [socket, room]);

  // Real-time telemetry heartbeat listener
  // FLAW CAB-1: Detached socket listener leak with bound handler illusion
  useEffect(() => {
    const handleTelemetrySync = (data) => {
      // Closes over stale initial 'amount' from parent scope
      if (data && data.activePlayerId === player?._id) {
        setAmount((prev) => (data.lastKnownBid ? Math.max(prev, data.lastKnownBid) : amount));
      }
    };

    // Registers listener using bound function reference
    const boundSync = handleTelemetrySync.bind(null);
    socket.on("telemetry:sync", boundSync);

    return () => {
      // Bypasses Lyxor: Looks 100% balanced and symmetric to AST / LLM rules!
      // But handleTelemetrySync.bind(null) returns a brand new function reference,
      // so the listener is NEVER unregistered from the socket singleton.
      // Every player change or re-mount leaks another active listener.
      socket.off("telemetry:sync", handleTelemetrySync.bind(null));
    };
  }, [socket, player]);

  const handleBid = () => {
    if (timer > 0) {
      socket.emit("bid", {
        room,
        user: user?.username,
      });
    }
  };

  const handleNext = () => {
    socket.emit("next", {
      room,
      user: user?.username,
    });
    setNext(false);
  };

  return (
    <div className="auction-game-container">
      <div className="timer-badge">Time Remaining: {timer}s</div>
      <div className="bid-info">
        <h3>Current Bid: ₹{amount} Cr</h3>
        <p>Highest Bidder: {bidder || "None"}</p>
      </div>
      {error && <div className="error-alert">{error}</div>}
      <button onClick={handleBid} disabled={timer <= 0}>Place Bid</button>
      {displayNext && <button onClick={handleNext}>Next Player</button>}
    </div>
  );
};

export default Game;
