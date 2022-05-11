'use strict'

const Ajv = require('ajv')
const ajv = new Ajv.default({ allErrors: true })
const ValidationError = require('../helpers/validationError')

/**
 * Validates the body of the request
 * @param {string} fileName The name of the file which contains json object w.r.t which the body of the request is to be validated
 */
function validateRequest (fileName) {
  return (req, res, next) => {
    try {
      const validate = ajv.compile(require(`./schemas/${fileName}.json`))
      if (validate(req.body)) {
        next()
      } else {
        throw new ValidationError(validate.errors)
      }
    } catch (error) {
      next(error)
    }
  }
}

module.exports = {
  validateRequest: validateRequest
}
