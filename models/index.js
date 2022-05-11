const mongoose = require('mongoose');
const portfolioSchema = require('../models/portfolio');
const tradeSchema = require('../models/trade');

// establish db connection only once at the start of the server
module.exports = async ({ $env }) => {
    let connection;
    try {
        connection = await mongoose.connect($env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        if(!connection) {
            throw new Error('Mongo Client not initialized');
        }
        console.log("Connected to Mongo DB", $env.DB_NAME);
        const portfolio = connection.model('Portfolio', portfolioSchema);
        const trade = connection.model('Trade', tradeSchema);
        return {
            portfolio,
            trade
        };
    } catch (error) {
        console.log(error);
        // close connection
        console.log("Closing connection");
        mongoose.connection.close();
    }
}