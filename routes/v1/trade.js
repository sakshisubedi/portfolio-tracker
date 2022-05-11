const routes = require('express').Router({ mergeParams: true });
const controllers = require("../../controllers/trade");
const validate = require("../../validators").validateRequest;

/**
 * Routes to perform CRUD operations on trade
 */
module.exports = ({ $config, $env, $models }) => {
    routes.get('/', controllers.fetchTrades({ $config, $env, $models }));
    routes.post('/', validate('addTrade'), controllers.addTrade({ $config, $env, $models }));
    routes.delete('/:id', controllers.removeTrade({ $config, $env, $models }));
    routes.patch('/:id', validate('updateTrade'), controllers.updateTrade({ $config, $env, $models }));
    return routes;
}