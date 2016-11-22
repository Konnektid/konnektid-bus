"use strict";



const expect = require("chai").expect;

const KndBus = require("../Bus");
const AmqpBus = require("../AmqpBus");

describe("konnektid-bus", () => {

    describe("Bus", () => {

        it("should correctly expose the interface", () => {
            expect(KndBus).to.respondTo("create");
        });

        it("should not return a Bus when no config is provided", () => {

            let b;
            const doTest = () => {
                b = KndBus.create({});
            };

            expect(doTest).to.not.throw();
            expect(b).to.not.exist;
        });

        it("should create an AMQP bus when the AMQP config is provided", () => {

            let b;
            const doTest = () => {
                b = KndBus.create({ amqp: {} });
            };

            expect(doTest).to.not.throw();
            expect(b).to.exist;
            expect(b).to.be.an.instanceOf(AmqpBus);
        });
    });
});

