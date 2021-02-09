const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const server = express();
///  ROUTES

///

server.use(express.json());
server.use(cors());
server.use(helmet());

server.get("/", (req, res) => {
  res.send("<h1>&emsp;&emsp;&emsp;&emsp;API IS UP 🤖<h1></h1>");
});

module.exports = server;
