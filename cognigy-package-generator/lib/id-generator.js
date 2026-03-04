const crypto = require("crypto");

let counter = 0;

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = crypto.randomBytes(5).toString("hex");
  const count = (counter++).toString(16).padStart(6, "0");
  return timestamp + random + count;
}

function generateUUID() {
  return crypto.randomUUID();
}

function generateResourcesHash() {
  return crypto.randomBytes(20).toString("hex");
}

module.exports = { generateObjectId, generateUUID, generateResourcesHash };
