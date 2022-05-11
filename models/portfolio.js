const mongoose = require("mongoose");

// Portfolio collection schema
const portfolioSchema = new mongoose.Schema({
    tickerSymbol: {
        type: String,
        required: true,
        unique: true,
        minlength: 1,
    },
    averageBuyPrice: {
        type: Number,
        min: 0,
        required: true
    },
    quantity: {
        type: Number,
        min: 0,
        required: true
    }
})


module.exports = portfolioSchema;