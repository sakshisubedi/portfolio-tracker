/**
 * Fetch all the securities and trades corresponding to it.
 * @path {GET} /trade
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data fetch all the securities and trades corresponding to it.
*/

const fetchTrades = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        try {
            const securities = await $models.portfolio.find().select('-_id -__v');
            const portfolio = await Promise.all(securities.map(async (security) => {
                const trades = await $models.trade.find({ tickerSymbol: security.tickerSymbol }).select('-tickerSymbol -__v');
                return {
                  [security.tickerSymbol]: {
                    trades,
                    averageBuyPrice: security.averageBuyPrice,
                    totalQuantity: security.quantity
                  },
                };
            }));
            return res.status(200).json({
                success: true,
                message: 'success',
                data: portfolio
            })
        } catch (error) {
            next(error);
        }
    }
}

/**
 * Add trade for a security.
 * @path {POST} /trade
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data add trade
*/

const addTrade = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        try {
            const { tickerSymbol, type, price, quantity } = req.body;
            // Check if a security exists in the portfolio for the ticker symbol
            let portfolio = await getPortfolioByTickerSymbol($models.portfolio, tickerSymbol);

            if(!portfolio) {
                if(type === "BUY") {
                    portfolio = await createPortfolio($models.portfolio, tickerSymbol, quantity, price);
                } else if (type === "SELL") {
                    if(quantity > 0) {
                        throw new Error("Insufficient quantity of stock in the portfolio.");
                    }
                }
            } else {
                if(type === "BUY") {
                    portfolio = await addBuyTradeToPortfolio(portfolio, price, quantity);
                } else if (type === "SELL") {
                    if(portfolio.quantity < quantity) {
                        throw new Error("Insufficient quantity of stock in the portfolio.");
                    }
                    portfolio = await addSellTradeToPortfolio(portfolio, quantity);
                }
            }

            const trade = await createTrade($models.trade, tickerSymbol, type, quantity, price);
            
            return res.status(200).json({
                success: true,
                message: 'success',
                data: trade
            })
        } catch (error) {
            next(error);
        }
    }
}

/**
 * Remove trade of a security from the portfolio, thus reverting the changes it had when it was added.
 * @path {DELETE} /trade
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data remove trade
*/

const removeTrade = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        try {
            const tradeId = req.params.id;
            if(!tradeId) {
                throw new Error("trade id is undefined");
            }
            let trade = await getTradeById($models.trade, tradeId);
            if(!trade) {
                throw new Error("Trade with given id not found.")
            }
            let portfolio = await getPortfolioByTickerSymbol($models.portfolio, trade.tickerSymbol);

            if(trade.type === "BUY") {
                if(portfolio.quantity < trade.quantity) {
                    throw new Error("Insufficient quantity of stock in the portfolio.");
                }
                portfolio = await removeBuyTradeFromPortfolio(portfolio, trade);
            } else {
                portfolio = await removeSellTradeFromPortfolio(portfolio, trade);
            }
            trade = await deleteTrade($models.trade, tradeId);

            return res.status(200).json({
                success: true,
                message: 'success',
                data: trade
            })
        } catch (error) {
            next(error);
        }
    }
}

/**
 * Updates trade and revert the changes from the portfolio it had when trade was added.
 * @path {PATCH} /trade
 * @response {String} success is true for successful completion of request
 * @response {String} message is successful if the request completes successfully and contains the error message in case of unsuccessful execution
 * @response {String} data update trade
*/

const updateTrade = ({ $config, $env, $models  }) => {
    return async (req, res, next) => {
        let trade;
        try {
            const { 
                tickerSymbol: newTickerSymbol,
                type: newType, 
                price: newPrice, 
                quantity: newQuantity 
            } = req.body;
            const tradeId = req.params.id;
            if(!tradeId) {
                throw new Error("trade id is undefined");
            }
            trade = await getTradeById($models.trade, tradeId);
            if(!trade) {
                throw new Error("Trade with given id not found.")
            }
            let portfolio = await getPortfolioByTickerSymbol($models.portfolio, trade.tickerSymbol);

            // remove old trade from portfolio
            if(trade.type === "BUY") {
                if(portfolio.quantity < trade.quantity) {
                    throw new Error("Insufficient quantity of stock in the portfolio.");
                }
                portfolio = await removeBuyTradeFromPortfolio(portfolio, trade);
            } else {
                portfolio = await removeSellTradeFromPortfolio(portfolio, trade);
            }

            if(trade.tickerSymbol !== newTickerSymbol) {
                portfolio = await getPortfolioByTickerSymbol($models.portfolio, newTickerSymbol);
            }
            
            // add new trade to portfolio
            if(!portfolio) {
                if(newType === "BUY") {
                    portfolio = await createPortfolio($models.portfolio, newTickerSymbol, newQuantity, newPrice);
                } else if (newType === "SELL") {
                    if(newQuantity > 0) {
                        // Restore portfolio for old trade details
                        portfolio = await getPortfolioByTickerSymbol($models.portfolio, trade.tickerSymbol);
                        portfolio = await addBuyTradeToPortfolio(portfolio, trade.price, trade.quantity);
                        throw new Error("Insufficient quantity of stock in the portfolio.");
                    }
                }
            } else {
                // add updated trade to portfolio
                if(newType === "BUY") {
                    portfolio = await addBuyTradeToPortfolio(portfolio, newPrice, newQuantity);
                } else if (newType === "SELL") {
                    if(portfolio.quantity < newQuantity) {
                        // Restore portfolio for old trade details
                        portfolio = await addBuyTradeToPortfolio(portfolio, trade.price, trade.quantity);
                        throw new Error("Insufficient quantity of stock in the portfolio.");
                    }
                    portfolio = await addSellTradeToPortfolio(portfolio, newQuantity);
                }
            }

            trade.tickerSymbol = newTickerSymbol;
            trade.type = newType;
            trade.quantity = newQuantity;
            trade.price = newPrice;
            trade = await trade.save();
            
            return res.status(200).json({
                success: true,
                message: 'success',
                data: trade
            })
        } catch (error) {
            next(error);
        }
    }
}

const createTrade = async (tradeModel, tickerSymbol, type, quantity, price) => {
    let trade = new tradeModel({
        tickerSymbol,
        type,
        quantity,
        price,
      });
    trade = await trade.save();
    return trade;
}

const deleteTrade = async (tradeModel, tradeId) => {
    const trade = await tradeModel.deleteOne({ _id: tradeId });
    return trade;
}

const getTradeById = async (tradeModel, tradeId) => {
    const trade = await tradeModel.findById(tradeId);
    return trade;
}

const createPortfolio = async (portfolioModel, tickerSymbol, quantity, averageBuyPrice) => {
    let portfolio = new portfolioModel({
        tickerSymbol,
        quantity,
        averageBuyPrice,
    });
    portfolio = await portfolio.save();
    return portfolio;
}

const getPortfolioByTickerSymbol = async (portfolioModel, tickerSymbol) => {
    const portfolio = await portfolioModel.findOne({ tickerSymbol });
    return portfolio;
}

const addBuyTradeToPortfolio = async (portfolio, price, quantity) => {
    portfolio.averageBuyPrice = (portfolio.averageBuyPrice*portfolio.quantity + price*quantity)/(portfolio.quantity + quantity);
    portfolio.quantity = portfolio.quantity + quantity;
    portfolio = await portfolio.save();
    return portfolio;
}

const addSellTradeToPortfolio = async (portfolio, quantity) => {
    portfolio.quantity = portfolio.quantity - quantity;
    portfolio = await portfolio.save();
    return portfolio;
}

const removeBuyTradeFromPortfolio = async (portfolio, trade) => {
    /*
        averageBuyPrice = (portfolioPrice * portfolioQuantity + tradePrice * tradeQuantity)/(portfolioQuantity+tradeQuantity)

        Therefore, portfolioPrice = (averageBuyPrice * (portfolioQuantity+tradeQuantity) - tradePrice * tradeQuantity) / portfolioQuantity;

        ==> oldPortfolioPrice = (newPortfolioPrice * newPortfolioQuantity - tradePrice * tradeQuantity) / oldPortfolioQuantity

        where oldPortfolioQuantity = newPortfolioQuantity - tradeQuantity
    */
    portfolio.averageBuyPrice = (portfolio.averageBuyPrice * portfolio.quantity - trade.price * trade.quantity) / (portfolio.quantity - trade.quantity) || 0;
    portfolio.quantity -= trade.quantity;
    portfolio = await portfolio.save();
    return portfolio;
}

const removeSellTradeFromPortfolio = async (portfolio, trade) => {
    portfolio.quantity += trade.quantity;
    portfolio = await portfolio.save();
    return portfolio;
}


module.exports = {
    fetchTrades,
    addTrade,
    removeTrade,
    updateTrade
}