"use strict";

const expect = require("chai").expect;

const KndBus = require("../index.js");

describe("konnektid-bus", () => {

    describe("AmqpBus", () => {

        it("should correctly expose the interface", () => {

            expect(KndBus).to.respondTo("on");
            expect(KndBus).to.respondTo("emit");
            expect(KndBus).to.respondTo("publish");
            expect(KndBus).to.respondTo("subscribe");
            expect(KndBus).to.respondTo("send");
            expect(KndBus).to.respondTo("listen");
            expect(KndBus).to.respondTo("sendTask");
            expect(KndBus).to.respondTo("listenTask");
            expect(KndBus).to.respondTo("call");
            expect(KndBus).to.respondTo("reply");
        });
    });
});
