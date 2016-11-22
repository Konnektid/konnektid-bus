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

let n = 0;
bus.subscribe("jeweet", data => {

    console.log("<<< Receive: " + new Date());
    console.log("   ", data);

    if (++n === 2)
        bus.close();
})
.then(() => {

    bus.publish("jeweet", "first message!").then(() => console.log(">>> Sent: " + new Date()));
    console.log("    Start send: " + new Date());
});

setTimeout(() => {

    const randomdata = {
        hello: "world",
        M_ID: 572,
        alpha: ["A", "B", "C"]
    };

    bus.publish("jeweet", randomdata).then(() => console.log(">>> Sent: " + new Date()));

}, 3000);

console.log("    Timer set: " + new Date());