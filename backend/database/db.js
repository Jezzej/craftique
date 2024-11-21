require('dotenv').config();
const mongoose = require("mongoose");

class Database {
  constructor() {
    this.connection = null;
  }

  async connectToDB() {
    if (this.connection) {
      console.log('Using existing database connection.');
      return this.connection;
    }

    try {
      this.connection = await mongoose.connect(process.env.MONGO_URI, // Use environment variables for sensitive info
        { useNewUrlParser: true, useUnifiedTopology: true }
      );
      console.log('Connected to DB');
      return this.connection;
    } catch (error) {
      console.error('Error connecting to DB:', error);
      throw error;
    }
  }
}

// Ensure you use an arrow function or bind the context when exporting
const databaseInstance = new Database();
module.exports = databaseInstance;
