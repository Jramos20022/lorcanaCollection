const { User, Deck } = require("../models");
const { signToken, AuthenticationError } = require("../utils/auth");

const getPrintingField = (printing) => {
  if (printing === "standard") return "standard_count";
  if (printing === "foil") return "foil_count";
  throw new Error("Printing must be standard or foil.");
};

const migrateCollectionCard = (card) => {
  if (!card.printing_counts_migrated) {
    card.standard_count = Math.max(0, Number(card.count) || 0);
    card.foil_count = 0;
    card.printing_counts_migrated = true;
  }

  card.count = (Number(card.standard_count) || 0) + (Number(card.foil_count) || 0);
  return card;
};

const getCollectionCardDetails = (card) => {
  const details = { ...card };
  delete details.count;
  delete details.standard_count;
  delete details.foil_count;
  return details;
};

const resolvers = {
  Query: {
    users: async () => {
      return User.find()
      .populate("decks");
    },
    user: async (parent, { username }) => {
      return User.findOne({ username })
      .populate("decks");
    },
    decks: async () => {
      return Deck.find().sort({ name: 1 });
    },
    deck: async (parent, { deckId }) => {
      return Deck.findOne({ _id: deckId });
    },
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate("decks");
      }
      throw AuthenticationError;
    },
    myDecks: async (parent, args, context) => {
      if (context.user) {
        return Deck.find({ user_id: context.user._id }).sort({ name: 1 }); 
      }
      throw AuthenticationError;
    },
    myCollection: async (parent, args, context) => {
      if (!context.user) throw AuthenticationError;

      const user = await User.findById(context.user._id);
      if (!user) throw AuthenticationError;

      user.cardCollection.forEach(migrateCollectionCard);
      await user.save();
      return user.cardCollection;
    },
  },

  Mutation: {
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { username, password }) => {
      const escapedUsername = username.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const user = await User.findOne({
        username: { $regex: `^${escapedUsername}$`, $options: "i" },
      });

      if (!user) {
        throw AuthenticationError;
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw AuthenticationError;
      }

      const token = signToken(user);

      return { token, user };
    },
    addDeck: async (parent, { deckName, cards }, context) => {
      if (!context.user) throw AuthenticationError;
      
      const deck = await Deck.create({
        deckName,
        cards,
        user_id: context.user._id,
      });
      console.log(deck);
      return deck;
    },
    addCard: async (parent, { deckId, image }, context) => {
      if (context.user) {
        return Deck.findOneAndUpdate(
          { _id: deckId },
          {
            $addToSet: {
              cards: { image },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      throw AuthenticationError;
    },
    removeDeck: async (parent, { deckId }, context) => {
      const deck = await Deck.findOneAndDelete({
        _id: deckId,
      });

      return deck;
    },
    removeCard: async (parent, { deckId, cardId }, context) => {
      if (context.user) {
        return Deck.findOneAndUpdate(
          { _id: deckId },
          {
            $pull: {
              cards: {
                _id: cardId,
              },
            },
          },
          { new: true }
        );
      }
      throw AuthenticationError;
    },
    updateDeck: async (
      parent,
      { deckId, deckName, cards }
    ) => {
      const updateFields = {};
      if (deckName) updateFields.deckName = deckName;
      if (cards) updateFields.cards = cards;

      return Deck.findOneAndUpdate(
        { _id: deckId },
        { $set: updateFields },
        { new: true }
      );
    },
    updateCollectionCard: async (parent, { card, printing, quantity }, context) => {
      if (!context.user) throw AuthenticationError;

      const user = await User.findById(context.user._id);
      if (!user) throw AuthenticationError;

      const printingField = getPrintingField(printing);
      const existingCard = user.cardCollection.find((item) => item.unique_id === card.unique_id);
      if (existingCard) {
        migrateCollectionCard(existingCard);
        existingCard.set({ ...getCollectionCardDetails(card), printing_counts_migrated: true });
        existingCard[printingField] = Math.max(0, quantity);
        migrateCollectionCard(existingCard);
      } else {
        const printingCounts = {
          standard_count: printing === "standard" ? Math.max(0, quantity) : 0,
          foil_count: printing === "foil" ? Math.max(0, quantity) : 0,
        };
        user.cardCollection.push({
          ...card,
          ...printingCounts,
          count: printingCounts.standard_count + printingCounts.foil_count,
          printing_counts_migrated: true,
        });
      }

      user.cardCollection = user.cardCollection.filter((item) => item.count > 0);

      await user.save();
      return user.cardCollection;
    },
    addCollectionCard: async (parent, { card, printing }, context) => {
      if (!context.user) throw AuthenticationError;

      const user = await User.findById(context.user._id);
      if (!user) throw AuthenticationError;

      const printingField = getPrintingField(printing);
      const existingCard = user.cardCollection.find((item) => item.unique_id === card.unique_id);
      if (existingCard) {
        migrateCollectionCard(existingCard);
        existingCard.set({ ...getCollectionCardDetails(card), printing_counts_migrated: true });
        existingCard[printingField] += 1;
        migrateCollectionCard(existingCard);
      } else {
        user.cardCollection.push({
          ...card,
          count: 1,
          standard_count: printing === "standard" ? 1 : 0,
          foil_count: printing === "foil" ? 1 : 0,
          printing_counts_migrated: true,
        });
      }

      await user.save();
      return user.cardCollection;
    },
    removeCollectionCard: async (parent, { uniqueId }, context) => {
      if (!context.user) throw AuthenticationError;

      const user = await User.findById(context.user._id);
      if (!user) throw AuthenticationError;

      user.cardCollection = user.cardCollection.filter((card) => card.unique_id !== uniqueId);
      await user.save();
      return user.cardCollection;
    },
  },
};

module.exports = resolvers;

// cards.map((card) => {
//   return {
//     _id: card._id, // Assuming you have an ID field for the card in your data model
//     // artist: card.Artist,
//     // set_name: card.Set_name,
//     // classifications: card.Classifications,
//     // abilities: card.Abilities,
//     // set_num: card.Set_Num,
//     // color: card.Color,
//     // franchise: card.Franchise,
//     image: card.Image,
//     // cost: card.Cost,
//     // inkable: card.Inkable,
//     // name: card.Name,
//     // type: card.Type,
//     // lore: card.Lore,
//     // rarity: card.Rarity,
//     // unique_id: card.Unique_ID,
//     // card_num: card.Card_Num,
//     // body_text: card.Body_Text,
//     // willpower: card.Willpower,
//     // strength: card.Strength,
//     // set_id: card.Set_ID, // Case-sensitive matching for Set_ID
//   };
// }),
