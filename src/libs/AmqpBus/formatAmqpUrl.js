/**
 * Konnektid - formatAmqpUrl
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

/**
 * Formats a AMQP url from the provided arguments
 *
 * @param {Object|String=}   arg            The input. Either a string (the connection URL), or an object with the
 *                                          optional keys { protocol, host, username, password, port, vhost }
 *
 * @returns {String}                        The AMQL connection URL (e.g. "amqp://admin:pass@localhost:5672/dev")
 */
const formatAmqpUrl = arg => {

    if (typeof arg === "string")
        return arg;

    const opts = arg || {};

    if (typeof opts.url === "string")
        return opts.url;

    const protocol = opts.protocol || "amqp";
    const host = opts.host || "localhost";
    const auth = opts.username ? opts.password ? `${opts.username}:${opts.password}@` : `${opts.username}@` : "";
    const port = (opts.port || 5672).toString();
    const vhost = opts.vhost ? `/${opts.vhost}` : "";

    return `${protocol}://${auth}${host}:${port}${vhost}`;
};

module.exports = formatAmqpUrl;