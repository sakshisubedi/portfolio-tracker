const routes = require('express').Router({ mergeParams: true });
const controllers = require("../../controllers/returns");

/**
 * Routes to perform CRUD operations on returns
 */
module.exports = ({ $config, $env, $models }) => {
    routes.get('/', controllers.fetchReturns({ $config, $env, $models }));
    return routes;
}