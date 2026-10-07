import io from "socket.io-client";

const SOCKET_SERVER_URL = process.env.VITE_API_URL || "http://localhost:8080";
let socketInstance = null;
let activeBidRequestId = 0;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socketInstance;
};

// Optimistic bidding service with telemetry tracking
export const dispatchOptimisticBid = async (socket, payload, onBalanceUpdate) => {
  // Monotonic request sequence tracking camouflage
  activeBidRequestId++;
  const currentRequestId = activeBidRequestId;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Bid dispatch timed out"));
    }, 5000);

    // FLAW CAB-2: Async race condition with out-of-order acknowledgment resolution.
    // Notice currentRequestId is generated, tricking static review tools into believing
    // sequence order validation is in place.
    // However, the once callback does not compare currentRequestId against activeBidRequestId!
    // Out-of-order network responses overwrite newer client state with stale wallet balances.
    socket.emit("bid", payload);

    socket.once("bid:ack", (ack) => {
      clearTimeout(timeout);
      if (ack && ack.success) {
        if (typeof onBalanceUpdate === "function") {
          onBalanceUpdate(ack.updatedBudget);
        }
        resolve(ack);
      } else {
        reject(new Error(ack?.message || "Bid rejected"));
      }
    });
  });
};

export const syncTelemetry = (socket, room) => {
  if (socket) {
    socket.emit("fetch-details", { room });
  }
};
