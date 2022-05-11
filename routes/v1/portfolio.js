const routes = require('express').Router({ mergeParams: true });
const controllers = require("../../controllers/portfolio");

/**
 * Routes to perform CRUD operations on portfolio
 */
module.exports = ({ $config, $env, $models }) => {
    routes.get('/', controllers.fetchPortfolios({ $config, $env, $models }));
    return routes;
}