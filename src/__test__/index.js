"use strict";



const expect = require("chai").expect;

const KndBus = require("../index");

describe("konnektid-bus", function () {

    it ("should correctly expose the interface", function () {
        expect(KndBus).to.respondTo("create");
    });
});

