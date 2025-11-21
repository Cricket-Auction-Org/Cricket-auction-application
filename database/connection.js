const mongoose = require("mongoose");

// Determine MongoDB URL based on environment
// Priority: PROD_MONGO_URL/DEV_MONGO_URL > MONGODB_URI (fallback)
let url;
if (process.env.NODE_ENV === "production") {
  url = process.env.PROD_MONGO_URL || process.env.MONGODB_URI;
} else {
  url = process.env.DEV_MONGO_URL || process.env.MONGODB_URI;
}

// Validate that URL is set
if (!url) {
  const envType =
    process.env.NODE_ENV === "production" ? "PROD_MONGO_URL" : "DEV_MONGO_URL";
  console.error(`❌ Error: MongoDB connection string is missing!`);
  console.error(`Please set ${envType} or MONGODB_URI environment variable.`);
  console.error(`Current NODE_ENV: ${process.env.NODE_ENV || "not set"}`);
  process.exit(1);
}

const db = mongoose
  .connect(url, {
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to the MongoDB database");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:");
    console.error(`Error name: ${error.name}`);
    console.error(`Error message: ${error.message}`);
    console.error("\nPlease check:");
    console.error("1. MongoDB connection string is correct");
    console.error(
      "2. MongoDB Atlas IP whitelist includes Railway's IPs (or 0.0.0.0/0)"
    );
    console.error("3. Database user credentials are correct");
    process.exit(1);
  });

module.exports = db;
