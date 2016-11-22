/**
 * Konnektid - Errors
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

// dependencies
const util = require("util");

/**
 * Creates a new TimeoutError
 * @param message
 * @constructor
 */
function TimeoutError(message) {
    Error.call(this);
    this.name = this.constructor.name;
    this.message = message;
    this.statusCode = 503;
}

util.inherits(TimeoutError, Error);

module.exports = {
    TimeoutError
};