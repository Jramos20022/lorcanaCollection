const mongoose = require('mongoose');

mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/illuminearsDB',
  { dbName: process.env.MONGODB_DB_NAME || 'illuminearsDB' }
);

module.exports = mongoose.connection;
