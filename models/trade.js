const mongoose = require("mongoose");

// Trade collection schema
const tradeSchema = new mongoose.Schema({
    tickerSymbol: {
        type: String,
        required: true,
        minlength: 1,
    },
    type: {
        type: String,
        enum: ["BUY", "SELL"],
        required: true,
    },
    price: {
        type: Number,
        default: 100,
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    }
})

module.exports = tradeSchema;