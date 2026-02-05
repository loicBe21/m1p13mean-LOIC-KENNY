const path = require("path");
const dotenv = require("dotenv");

const nodeEnv = process.env.NODE_ENV || "development";
const envFile = nodeEnv === "production" ? ".env.prod" : ".env.dev";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

module.exports = {
  NODE_ENV: nodeEnv,
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
};
