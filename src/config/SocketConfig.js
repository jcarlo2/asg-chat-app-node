const Message = require("../database/model/Message");
const User = require("../database/model/User");

const io = require("socket.io")(3011, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

io.on("connection", async (socket) => {
  socket.on('send',(room, message, username)=> {
    socket.emit('pop',room, message, username)
  })
});

module.exports = io;