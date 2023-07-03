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


// socket.on("send-message", async (room, message, username) => {
//   // const user = await User.findOne({ where: { username } });
//   // const messageEntity = await Message.create({
//   //   conversationId: room,
//   //   message,
//   //   username,
//   // });
//   console.log(message);
//   socket.emit("received", message);
//   socket.to(room).emit("received", message);

//   // socket.to(room.toString()).emit("hey", {
//   //   id: 5,
//   //   initial: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
//   //   fullName: `${user.firstName} ${user.lastName}`,
//   //   content: message,
//   //   username,
//   // });
// });