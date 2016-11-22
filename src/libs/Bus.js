/**
 * Konnektid - Bus
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

const AmqpBus = require("./AmqpBus");

const create = config => {

    if (config.amqp)
        return new AmqpBus(config);
};

module.exports = { create, createBus: create };