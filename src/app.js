const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const cors = require("cors");
const cookieParser = require("cookie-parser");
const port = 3010;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200,
  })
);

const Message = require("./database/model/Message");
const User = require("./database/model/User");
const authMiddleware = require("./middleware/authMiddleware");
const userRoute = require("./route/api");
const authRoute = require("./route/auth");
app.use("/api/v1/user", authMiddleware, userRoute);
app.use("/api/v1/auth", authRoute);

const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

io.on("connection", async (socket) => {
  socket.on("send", async ({ room, message, username }) => {
    const user = await User.findOne({ where: { username } });
    const messageEntity = await Message.create({
      conversationId: room,
      message,
      username,
    });
    const meme = await Message.findOne({
      where: { id: messageEntity.id },
    });
    const newMessage = {
      id: messageEntity.id,
      initial: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
      fullName: `${user.firstName} ${user.lastName}`,
      content: message,
      username,
    };
    io.emit(room.toString(), newMessage, room, meme.createdAt);
  });

  socket.on("change", ({ friendId, action }) => {
    console.log(`${friendId} : @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@`)
    if(typeof friendId === 'number') io.emit(`change-list-${friendId}`, action);
  });
});

server.listen(port, () => {
  console.log(`Listening at port: ${port}`);
});
