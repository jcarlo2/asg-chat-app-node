const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op, QueryTypes } = require("sequelize");
const { validationResult } = require("express-validator");
const { sequelize } = require("../database/connection");
const io = require("../config/SocketConfig");
const SECRET_KEY = "asg-chat-app";

const User = require("../database/model/User");
const Friendship = require("../database/model/Friendship");
const Conversation = require("../database/model/Conversation");
const Message = require("../database/model/Message");
const Participant = require("../database/model/Participant");

const findAllFriends = async (req, res) => {
  const username = req.cookies.auth_username;
  const friends = await Friendship.findAll({
    where: {
      userId: username,
      status: "FRIEND",
    },
  });
  const list = await setFriendList(friends, username);
  res.json(list);
};

const setFriendList = async (friends, username) => {
  const friendList = [];
  for (const friend of friends) {
    const friendEntity = await User.findOne({
      where: { username: friend.friendId },
    });

    const conversation = await Conversation.findOne({
      where: { id: friend.conversationId },
    });
    const lastMessage = await Message.findOne({
      where: { conversationId: friend.conversationId },
      order: [["created_at", "DESC"]],
    });
    friendList.push({
      conversationId: friend.conversationId,
      username: friendEntity.username,
      id: friendEntity.id,
      fullName: friendEntity.firstName + " " + friendEntity.lastName,
      initial:
        friendEntity.firstName.charAt(0) + friendEntity.lastName.charAt(0),
      status: friend.status,
      lastMessage: lastMessage ? lastMessage.message : "",
      isLastSender: lastMessage ? username === lastMessage.username : false,
      type: conversation.type,
      date: lastMessage ? lastMessage.createdAt : "",
    });
  }

  return friendList;
};

const findProfile = async (req, res) => {
  const username = req.cookies.auth_username;
  const user = await User.findOne({
    where: {
      username,
    },
  });
  res.json({
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    birthdate: user.birthdate,
    gender: user.gender,
  });
};

const userUpdate = async (req, res) => {
  const profile = req.body.profile;
  const update = await User.update(profile, {
    where: {
      id: profile.id,
      username: profile.username,
    },
  });
  res.json({
    update: true,
  });
};

const findBlockedFriends = async (req, res) => {
  const username = req.cookies.auth_username;
  const list = await Friendship.findAll({
    where: {
      user_id: username,
      status: "Blocked 0",
    },
  });
  const promises = list.map(async (block) => {
    const blockedUser = await User.findOne({
      where: { username: block.friendId },
    });

    return {
      id: blockedUser.id,
      initial: `${blockedUser.firstName.charAt(0)}${blockedUser.lastName.charAt(
        0
      )}`,
      fullName: `${blockedUser.firstName} ${blockedUser.lastName}`,
    };
  });

  const newList = await Promise.all(promises);
  res.json(newList);
};

const findFriendRequest = async (req, res) => {
  const username = req.cookies.auth_username;
  const list = await Friendship.findAll({
    where: {
      user_id: username,
      status: {
        [Op.in]: ["PENDING REQUEST", "PENDING APPROVED"],
      },
    },
  });
  const promises = list.map(async (people) => {
    const user = await User.findOne({
      where: { username: people.friendId },
    });
    return {
      id: user.id,
      initial: `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`,
      fullName: `${user.firstName} ${user.lastName}`,
      status: people.status,
    };
  });
  res.json(await Promise.all(promises));
};

const search = async (req, res) => {
  try {
    const username = req.cookies.auth_username;
    const search = req.body.search;
    const user = await User.findOne({ where: { username } });
    const userList = await sequelize.query(
      `SELECT * FROM users
      WHERE username != :username
      AND (email LIKE :searchKeyword
        OR firstName LIKE :searchKeyword
        OR lastName LIKE :searchKeyword
        OR username LIKE :searchKeyword)`,
      {
        replacements: { username, searchKeyword: `%${search}%` },
        type: QueryTypes.SELECT,
      }
    );

    const list = [];
    for (const user of userList) {
      const friend = await Friendship.findOne({
        where: {
          user_id: username,
          friend_id: user.username,
        },
      });

      if (!friend) {
        list.push({
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          initial: user.firstName.charAt(0) + user.lastName.charAt(0),
          status: "",
        });
      } else if (
        friend.status !== "BLOCKED 0" &&
        friend.status !== "BLOCKED 1"
      ) {
        list.push({
          id: user.id,
          fullName: `${user.firstName} ${user.lastName}`,
          initial: user.firstName.charAt(0) + user.lastName.charAt(0),
          status: friend.status,
        });
      }
    }

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

const unblockAndUnfriend = async (req, res) => {
  const id = req.body.id;
  const username = req.cookies.auth_username;
  const { user, friendship } = await findFriendshipAndUser(username, id);
  user.status = "";
  await user.save();
  friendship.status = "";
  await friendship.save();
};

const block = async (req, res) => {
  const id = req.body.id;
  const username = req.cookies.auth_username;
  const { user, friendship } = await findFriendshipAndUser(username, id);
  user.status = "BLOCKED 0";
  await user.save();
  friendship.status = "BLOCKED 1";
  await friendship.save();
  findBlockedFriends(req, res);
};

const add = async (req, res) => {
  const id = req.body.id;
  const username = req.cookies.auth_username;
  const { user, friendship, isContinue } = await findFriendshipAndUser(
    username,
    id
  );
  if (isContinue) {
    user.status = "PENDING REQUEST";
    await user.save();
    friendship.status = "PENDING APPROVED";
    await friendship.save();
  }
  findBlockedFriends(req, res);
};

const accept = async (req, res) => {
  const username = req.cookies.auth_username;
  const id = req.body.id;
  const { user, friendship } = await findFriendshipAndUser(username, id);
  user.status = "FRIEND";
  await user.save();
  friendship.status = "FRIEND";
  await friendship.save();
  findAllFriends(req, res);
};

const findFriendshipAndUser = async (authUsername, friendId) => {
  try {
    const friend = await User.findOne({ where: { id: friendId } });
    const user = await Friendship.findOne({
      where: { userId: authUsername, friendId: friend.username },
    });
    const friendship = await Friendship.findOne({
      where: { userId: friend.username, friendId: authUsername },
    });
    if (user === null && friendship === null) {
      const friend = await User.findOne({ where: { id: friendId } });
      const newConversation = await Conversation.create();
      const newFriendship = await Friendship.create({
        conversationId: newConversation.id,
        userId: authUsername,
        friendId: friend.username,
        status: "PENDING REQUEST",
      });
      const otherFriendship = await Friendship.create({
        conversationId: newConversation.id,
        userId: friend.username,
        friendId: authUsername,
        status: "PENDING APPROVED",
      });
      return {
        user: newFriendship,
        friendship: otherFriendship,
        isContinue: false,
      };
    }
    return { user, friendship, isContinue: true };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const findAllMessage = async (req, res) => {
  const username = req.cookies.auth_username;
  const list = await Message.findAll({
    where: { conversationId: req.body.id },
  });
  const friend = await User.findOne({ where: { id: req.body.friendId } });
  const user = await User.findOne({
    where: { username },
  });
  const newList = [];
  for (const message of list) {
    newList.push({
      id: message.id,
      fullName:
        message.username === username
          ? `${user.firstName} ${user.lastName}`
          : `${friend.firstName} ${friend.lastName}`,
      initial:
        message.username === username
          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
          : `${friend.firstName.charAt(0)}${friend.lastName.charAt(0)}`,
      content: message.message,
      username: message.username,
    });
  }
  res.json(newList);
};

// AUTH

const store = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.json({ errors: errors.array() });
      return;
    }

    encodeBcrypt(req.body.password)
      .then(async (hash) => {
        const username = req.body.username;
        const userData = {
          username,
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: hash,
          gender: req.body.gender,
          birthdate: req.body.birthdate,
        };

        await User.create(userData);
        makeJWToken(res, username);
        makeCookies("auth_username", username, res);
        res.json({
          fullName: req.body.firstName + " " + req.body.lastName,
          isVerified: true,
        });
      })
      .catch((err) => {
        res.send(err);
      });
  } catch (error) {
    res.send(error);
  }
};

const verify = async (req, res) => {
  const { username, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.json({ errors: errors.array() });
    return;
  }

  const user = await User.findOne({ where: { username } });
  // return if user not existing
  if (user === null) {
    res.json({
      isVerified: false,
      message: "Login failed",
    });
    return
  }
  bcrypt.compare(password, user.password, (err, isSame) => {
    if (err) console.log(err);
    if (isSame) {
      makeJWToken(res, username);
      makeCookies("auth_username", username, res);
      res.json({ isVerified: true, message: "Login successful" });
    } else {
      res.json({
        isVerified: false,
        message: "Login failed",
      });
    }
  });
};

const encodeBcrypt = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

const makeJWToken = (res, username) => {
  const sessionToken = jwt.sign({ username }, SECRET_KEY, {
    expiresIn: "24h",
  });
  makeCookies("jwt", sessionToken, res);
};

const makeCookies = (tokenName, token, res) => {
  res.cookie(tokenName, token, {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    secure: false,
    httpOnly: true,
  });
};

const joinRoom = async (req, res) => {
  const username = req.cookies.auth_username;
  const friends = await Friendship.findAll({ where: { userId: username } });
  for (const friend of friends) {
    // io.join(friend.conversationId)
  }
};

const logout = (req, res) => {
  res.clearCookie("auth_username");
  res.clearCookie("jwt");
  res.json({ logout: true });
};

module.exports = {
  store,
  verify,
  findAllFriends,
  findProfile,
  userUpdate,
  findBlockedFriends,
  findFriendRequest,
  search,
  unblockAndUnfriend,
  block,
  add,
  accept,
  findAllMessage,
  logout,
  joinRoom,
};
