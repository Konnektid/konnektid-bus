/**
 * Konnektid - test2
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

const KndBus = require("../index");
const config = require("./config");
const util = require("util");

const bus = KndBus.create(config);

bus.reply("jeweet-rpc", data => {

    console.log("||| RECEIVE:", data);

    if (typeof data.dx === "undefined" || typeof data.dy === "undefined")
        return Promise.reject("{dx, dy} missing");

    const dxdx = Math.pow(data.dx, 2);
    const dydy = Math.pow(data.dy, 2);
    const dz = Math.sqrt(dxdx + dydy);

    return Promise.resolve(dz);
});

const call = (name, data) => {
    console.log("\n>>> SENDING: " + name + "(" + (data ? util.inspect(data) : "") + ")");
    return bus.call(name, data);
};

call("jeweet-rpc-unexisting")
.then(res => console.log("<<< SUCCESS:", res))
.catch(err => console.log("<<< FAILED:", err));

setTimeout(() => {

    call("jeweet-rpc", { test: "data" })
    .then(res => console.log("<<< SUCCESS:", res))
    .catch(err => console.log("<<< FAILED:", err));

}, 1500);

const randomdata = {
    dx: 3,
    dy: 4
};

setTimeout(() => {

    call("jeweet-rpc", randomdata)
    .then(res => {

        console.log("<<< SUCCESS:", res);
        bus.close();
    })
    .catch(err => {
        console.log("<<< FAILED:", err);
        bus.close();
    });
}, 3500);