"use strict";



const expect = require("chai").expect;

const Errors = require("../Errors");

describe("konnektid-bus Errors", function () {

    it ("should correctly expose the interface", function () {

        expect(Errors).to.have.property("TimeoutError");

    });

    describe("#TimeoutError", function () {

        it ("should be of type Error", function () {

            const toe = new Errors.TimeoutError();

            expect(toe).to.be.a.instanceOf(Errors.TimeoutError);
            expect(toe).to.be.a.instanceOf(Error);
        });

        it ("should be throwable", function () {

            function test() {
                throw new Errors.TimeoutError();
            }
            expect(test).to.throw(Errors.TimeoutError);
        });

        it ("should have the correct name", function () {

            const toe = new Errors.TimeoutError();

            expect(toe.name).to.equal("TimeoutError");
        });

        it ("should have the correct message set", function () {

            const msg = "this is the message to use";

            const toe = new Errors.TimeoutError(msg);

            expect(toe.message).to.equal(msg);
        });
    });

});

