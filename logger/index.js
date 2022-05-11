'use strict'

const winston = require('winston')
// const appRoot = require('app-root-path')

const logger = () => {
  let logwriter
  let logConfig

  /**
     * Object Filter
     * @param {*} input
     * @param {*} whiteList
     */
  const filterObject = (input, whiteList) => {
    const obj = {}
    let fieldsSet = false;

    [].concat(whiteList).forEach((prop) => {
      const value = input[prop]
      if (typeof (value) !== 'undefined') {
        obj[prop] = value
        fieldsSet = true
      }
    })

    return fieldsSet ? obj : undefined
  }

  /**
     * JSON to string conveter
     * @param {*} body
     * @param {*} isJSON
     */
  const bodyToString = (body, isJSON) => {
    const stringBody = body && body.toString()
    if (isJSON) {
      try {
        return JSON.parse(body)
      } catch (e) {
        return stringBody
      }
    }
    return stringBody
  }

  /**
     * Initialize method
     */
  this.initialize = (rootPath, dirFilter, config) => {
    logConfig = config
    const stringifyLogs = logConfig.features ? logConfig.features.stringifyLogs : true
    const consoleLogs = logConfig.features ? logConfig.features.consoleLogs : true

    if (consoleLogs) {
      logwriter = winston.createLogger({
        transports: [
          new winston.transports.Console({
            level: 'debug', // log all.. we control levels on the producer side
            json: true,
            colorize: false,
            handleExceptions: true,
            stringify: stringifyLogs // one line in stdout per log

          })
        ],
        exitOnError: false
      })
    } else {
      logwriter = winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        transports: [
          //
          // - Write to all logs with level `info` and below to `combined.log`
          // - Write all logs error (and below) to `error.log`.
          //
          new winston.transports.File({ filename: 'error.log', level: 'error' }),
          new winston.transports.File({ filename: 'combined.log' })
        ],
        exitOnError: false
      })
    }
    return Promise.resolve()
  }

  /**
     * Log custom messages
     */
  this.logMessage = (level, ctx, payLoad, category, root) => {
    try {
      const rootElement = root || 'LogMessage'
      const loggingEnabled = level !== 'debug'
      const featureConfig = (logConfig && logConfig.features) || { loggingEnabled: false }
      const logData = {}
      const logMsg = {}

      if (featureConfig && featureConfig.loggingEnabled) {
        if (loggingEnabled) {
          logData.context = ctx
          logData.log = payLoad

          logMsg[rootElement] = logData
          logMsg.category = category
          logwriter.log(level, '', logMsg)
        }
      }
    } catch (err) {
      console.log(JSON.stringify({
        LoggerError: {
          context: ctx,
          error: JSON.stringify(err, Object.getOwnPropertyNames(err)),
          level: 'error',
          message: 'logger.logMessage'
        }
      }))
    }
  }

  /**
     * Request and response logger for express server
     */
  this.logAPIDetails = () => {
    let statusLevels = 'info'
    const requestWhitelist = ['url', 'method', 'httpVersion', 'originalUrl', 'query', 'context']
    const responseWhitelist = ['statusCode']

    return function (req, res, next) {
      try {
        const logMode = logConfig.features ? logConfig.features.logMode : 'ReqResp'
        if (logMode === 'ReqResp') {
          requestWhitelist.push('body')
          responseWhitelist.push('body')
        } else if (logMode === 'Req') {
          requestWhitelist.push('body')
        } else if (logMode === 'Resp') {
          responseWhitelist.push('body')
        }
        req._startTime = (new Date())

        // Manage to get information from the response too, just like Connect.logger does:
        const end = res.end
        res.end = function (chunk, encoding) {
          res.responseTime = (new Date()) - req._startTime

          res.end = end
          res.end(chunk, encoding)

          req.url = req.originalUrl || req.url

          if (res.statusCode >= 100) {
            statusLevels = 'info'
          }
          if (res.statusCode >= 400) {
            statusLevels = 'warn'
          }
          if (res.statusCode >= 500) {
            statusLevels = 'error'
          }

          const logData = { date: (new Date()).toUTCString(), res: res }

          if (responseWhitelist.includes('body')) {
            if (chunk) {
              const isJson = (res._headers && res._headers['content-type'] && res._headers['content-type'].indexOf('json') >= 0)
              logData.res.body = bodyToString(chunk, isJson)
            }
          }

          logData.req = filterObject(req, requestWhitelist)
          logData.res = filterObject(res, responseWhitelist)
          logData.res.responseTime = res.responseTime

          logwriter.log(statusLevels, `${req.method} ${req.path}`, { APILog: logData })
        }
      } catch (err) {
        console.log(JSON.stringify({
          LoggerError: {
            context: req.context,
            error: err,
            level: 'error',
            message: 'logger.logger'
          }
        }))
      } finally {
        next()
      }
    }
  }

  /**
     * Error logger for express server
     */
  this.logAPIError = () => {
    const requestWhitelist = ['url', 'method', 'httpVersion', 'originalUrl', 'query', 'context']

    return function (err, req, res, next) {
      try {
        // Let winston gather all the error data.
        const exceptionMeta = winston.exception.getAllInfo(err)
        exceptionMeta.req = filterObject(req, requestWhitelist)

        delete exceptionMeta.req.headers
        delete exceptionMeta.req.body

        exceptionMeta.req.context = req.context // always add context .
        exceptionMeta.date = (new Date()).toUTCString()
        logwriter.log('error', `${req.method} ${req.url}`, { APILog: exceptionMeta })
      } catch (err1) {
        console.log(JSON.stringify({
          LoggerError: {
            context: req.context,
            error: err1,
            level: 'error',
            message: 'logger.errorLogger'
          }
        }))
      } finally {
        next(err)
      }
    }
  }

  return this
}

module.exports = logger()
