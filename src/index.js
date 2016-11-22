/**
 * Konnektid-bus
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

// dependencies
const Bus = require("./libs/Bus");
const Errors = require("./libs/Errors");

// export the bus constructor
module.exports = Bus;
module.exports.Errors = Errors;
