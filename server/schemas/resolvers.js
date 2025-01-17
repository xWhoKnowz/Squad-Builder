const { Game, Player, Squad } = require("../models/index");
const { signToken, AuthenticationError } = require("../utils/auth");

const resolvers = {
  Query: {
    players: async () => {
      return Player.find({}).populate("friends");
    },
    player: async (parent, { username }) => {
      return Player.findOne({ username }).populate("friends", "squads");
    },
    games: async () => {
      return Game.find({});
    },
    game: async (parent, { gameId }) => {
      return Game.findOne({ _id: gameId }).populate("squads");
    },
    squad: async (parent, { squadId }) => {
      return Squad.findOne({ _id: squadId }).populate("players");
    },
    squads: async (parent, { username }) => {
      return Squad.find({ username }).populate("players");
    },
    squads: async (parent, { gameName }) => {
      return Squad.find({ name: gameName });
    },
    me: async (parent, args, context) => {
      console.log(context);
      if(context.user) {
        return Player.findOne(
          {_id : context.user._id}
          // {_id : "65f0776c8ddef36899508259"}
          ).populate("friends", "squads");
      }
        throw AuthenticationError
      
    } 
  },

  Mutation: {
    addPlayer: async (parent, { username, email, password }) => {
      const player = await Player.create({ username, email, password });
      const token = signToken(player);
      return { token, player };
    },
    login: async (parent, { email, password }) => {
      const player = await Player.findOne({ email });
      if (!player) {
        throw AuthenticationError;
      }
      pwMatch = await player.isCorrectPassword(password);
      if (!pwMatch) {
        throw AuthenticationError;
      }
      const token = signToken(player);
      return { token, player };
    },
    removePlayer: async (parent, { playerId }) => {
      return Player.findOneAndDelete({ _id: playerId });
    },
    addFriend: async (parent, { playerId, friendId }) => {
      return Player.findOneAndUpdate(
        { _id: playerId },
        { $addToSet: { friends: friendId } },
        { new: true, runValidators: true }
      );
    },
    removeFriend: async (parent, { playerId, friendId }) => {
      return Player.findOneAndUpdate(
        { _id: playerId },
        { $pull: { friends: friendId } },
        { new: true, runValidators: true }
      );
    },

    addGame: async (parent, { name, image, description }) => {
      return Game.create({ name, image, description });
    },
    removeGame: async (parent, { gameID }) => {
      return Game.findOneAndDelete({ _id: gameId });
    },
    addSquad: async (
      parent,
      {
        playerId ,
        gameId,
        squadName,
        playerCount,
        description,
        ranked,
        playStyle,
        createdBy,
        // gameFor,
      }
    ) => {
      if (context) {
      const squad = await Squad.create({
        squadName,
        playerCount,
        description,
        ranked,
        playStyle,
        createdBy,
        // gameFor,
      });

      await Player.findOneAndUpdate(
        { _id: context.player._id },
        { $addToSet: { squads: squad } }
      );

      await Game.findOneAndUpdate(
        { _id: gameId },
        { $addToSet: { squads: squad } }
      );
      return squad;
      }
    },

    removeSquad: async (parent, { squadId, playerId, gameId }) => {
      await Squad.findOneAndDelete({
        _id: squadId,
      });

      await Player.findOneAndUpdate(
        { _id: playerId },
        { $pull: { squads: squadId } }
      );

      await Game.findOneAndUpdate(
        { _id: gameId },
        { $pull: { squads: squadId } }
      );
      return squadId;
    },

    squadPlus: async (parent, { squadId, playerId }) => {
      return Squad.findOneAndUpdate(
        { _id: squadId },
        { $addToSet: { players: playerId } },
        { new: true }
      );
    },

    squadMinus: async (parent, { squadId, playerId }) => {
      return Squad.findOneAndUpdate(
        { _id: squadId },
        { $pull: { players: playerId } },
        { new: true }
      );
    },
  },
};

module.exports = resolvers;
