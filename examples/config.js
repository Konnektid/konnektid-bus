/**
 * Konnektid - config
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

const config = {
    timeout: 1000,
    amqp: {
        protocol: "amqp",
        username: "admin",
        password: "nXUmisHQVf7adUI3pcZVuUKpiiEElEiA",
        host    : "rabbitmq.dev.konnektid.com",
        port    : 5672,
        vhost   : "development"
    }
};

module.exports = config;