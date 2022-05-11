'use strict'
/**
 * Returns an express.js error handling middleware.
 * @param {Object} options - options that control the error handling middleware's behavior.
 * @param {boolean} options.detailed - return detailed error details and a stack trace.
 */
const errorHandler = (options) => {
  return function (err, req, res, next) {
    // Delegate to the default error handling mechanisms in Express if the response
    // is already being streamed to the client.
    if (res.headersSent) {
      return next(err)
    }

    if (err.name === 'UnauthorizedError') {
      // jwt authentication error
      return res.status(401).json({
        success: false,
        Error: {
          Code: 401,
          Message: 'Invalid Token',
          Details: (options.detailed) ? err.details || err : undefined,
          StackTrace: (options.detailed) ? err.stack : undefined
        }
      })
    }

    // Use the error's specified HTTP status code if present, otherwise fall back to HTTP 500.
    let status = err.status || err.statusCode
    if (typeof status !== 'number') {
      status = 500
    }

    // Log application errors to the console in development environments.
    const devMode = (!process.env.NODE_ENV || process.env.NODE_ENV === 'development')
    if (devMode && status >= 500) {
      console.error(err.stack || err.toString())
    }

    // Avoid sending detailed information in production environments and for
    // certain classes of errors.
    res.status(status).send({
      success: false,
      Error: {
        Code: (status < 500) ? err.code || err.name : undefined,
        Message: (status < 500) ? err.message : 'Internal server error',
        Details: (options.detailed) ? err.details || err : undefined,
        StackTrace: (options.detailed) ? err.stack : undefined
      }
    })
  }
}

module.exports = {
  errorHandler
}
