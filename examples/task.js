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

const bus = KndBus.create(config);
bus.events.on("ready", () => console.log("    Connected: " + new Date()));

let listener;
bus.listenTask("jeweet-persist", data => {

    console.log("<<< Receive: " + new Date());
    console.log("   ", data);

    bus.close()
    .then(() => process.exit(0));
})
.then(l => listener = l);

setTimeout(() => {

    listener.cancel();

    const randomdata = {
        hello: "world",
        M_ID: 572,
        alpha: ["A", "B", "C"]
    };

    bus.sendTask("jeweet-persist", randomdata)
    .then(() => {
        console.log(">>> Sent: " + new Date());
        bus.close();
    });

}, 3000);

console.log("    Timer set: " + new Date());