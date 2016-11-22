/**
 * Konnektid - payloadFormatter
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

const toBuffer = x => new Buffer(x);
const fromBuffer = x => x.toString();

const toJSON = x => JSON.stringify(x);
const fromJSON = x => JSON.parse(x);

const comp = (f, g) => x => f(g(x));

const encode = comp(toBuffer, toJSON);
const decode = comp(fromJSON, fromBuffer);

module.exports = { encode, decode };