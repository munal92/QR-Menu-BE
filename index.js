require("dotenv").config();
const server = require("./api/server.js");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 5000;

mongoose.connect(
  process.env.DB_CONNECTION,
  { useUnifiedTopology: true, useNewUrlParser: true },

  () => console.log("Connected to MongoDB")
);

server.listen(PORT, () => {
  console.log(`///--> SERVER RUNNING ON ${PORT}`);
});
