'use strict'

const apiLogger = require('../index')

const config = {
  features: {
    logMode: 'ReqResp',
    stringifyLogs: false,
    consoleLogs: true,
    loggingEnabled: true
  }
}

apiLogger.initialize(config)
  .then(() => {
    apiLogger.logMessage('info', {}, { payLoad: 'test data' }, 'testing', 'APILogs')

    // apiLogger.logger();
    // apiLogger.errorLogger();
  })
