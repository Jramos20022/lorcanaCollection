const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const collectionCardSchema = new Schema({
  image: { type: String, required: true },
  name: { type: String, required: true },
  set_name: String,
  set_num: Number,
  color: String,
  cost: Number,
  inkable: Boolean,
  type: String,
  rarity: String,
  unique_id: { type: String, required: true },
  card_num: String,
  set_id: String,
  count: { type: Number, required: true, min: 0, default: 0 },
  standard_count: { type: Number, min: 0, default: 0 },
  foil_count: { type: Number, min: 0, default: 0 },
  printing_counts_migrated: { type: Boolean, default: false },
});

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+@.+\..+/, "Must match an email address!"],
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
  },
  decks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Deck", 
    },
  ],
  cardCollection: [collectionCardSchema],
});

userSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("password")) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

userSchema.methods.isCorrectPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = model("User", userSchema);

module.exports = User;
