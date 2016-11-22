"use strict";

const expect = require("chai").expect;

const payloadFormatter = require("../payloadFormatter");

describe("konnektid-bus", () => {

    describe("AmqpBus", () => {

        describe("payloadFormatter", () => {

            it("should correctly expose the interface", () => {

                expect(payloadFormatter).to.respondTo("encode");
                expect(payloadFormatter).to.respondTo("decode");
            });

            it("should correctly encode an object to a buffer", () => {

                const data = { hello: "world" };

                let res;
                const doTest = () => {
                    res = payloadFormatter.encode(data);
                };

                expect(doTest).to.not.throw();
                expect(res).to.be.an.instanceOf(Buffer);
            });

            it("should correctly encode an object to a buffer", () => {

                const buff = new Buffer("7b2268656c6c6f223a22776f726c64227d", "hex");

                let res;
                const doTest = () => {
                    res = payloadFormatter.decode(buff);
                };

                expect(doTest).to.not.throw();
                expect(res).to.be.an.instanceOf(Object);
                expect(res.hello).to.equal("world");
            });

            it("should correctly encode/decode different data types", () => {

                const datas = [
                    { hello: "world" },
                    { num: 42 },
                    { nested: { and: { more: { nested: "objects " }, ok: 1337 } } },
                    5673525,
                    "Simple string",
                    { can: { also: { contain: null, and: true, or: false, butNot: "Infinity or NaN" } } }
                ];

                let res;
                const doTest = () => {
                    res = datas.map(d => payloadFormatter.decode(payloadFormatter.encode(d)));
                };

                expect(doTest).to.not.throw();
                expect(res.length).to.equal(datas.length);
                for (let i = 0; i < datas.length; i++)
                    expect(res[i]).to.deep.equal(datas[i]);

            });
        });
    });
});
