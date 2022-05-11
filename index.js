const express = require('express');
const app = express();
const routes = require('./routes/v1');
const $logger = require('./logger');
const $config = require('./config');
const apiErrorHandler = require('./helpers/errorHandler').errorHandler;
require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


async function startApp () {
    const $env = process.env;
    const PORT = $env.PORT || 5000;
    const $models = await require('./models')({ $env });
    $logger.initialize('', '', $config.logger).then(() => {

        app.use($logger.logAPIDetails());
        app.use($logger.logAPIError());

        // health check
        app.get('/', (req, res) => {
            return res.status(200).json({
                message: 'success',
                success: true,
                data: 'test'
            })
        });

        app.use('/api/v1', routes({ $config, $env, $models}));
        app.use(apiErrorHandler({ detailed: $env.NODE_ENV !== 'production' }))

        app.listen(PORT, () => $logger.logMessage('info', 'Server Started', `Server listening on ${PORT}`, 'app.js'))

    });
}

startApp();

module.exports = app;