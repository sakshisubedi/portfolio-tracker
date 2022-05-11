const routes = require('express').Router({ mergeParams: true });

/**
 * Redirect to appropriate routes and middleware function(s) if any
 */
module.exports = ({ $config, $env, $models  }) => {
    routes.use('/trade', require('./trade')({ $config, $env, $models }));
    routes.use('/portfolio', require('./portfolio')({ $config, $env, $models }));
    routes.use('/returns', require('./returns')({ $config, $env, $models }));
    return routes;
}