"use strict";

const expect = require("chai").expect;

const formatAmqpUrl = require("../formatAmqpUrl");

describe("konnektid-bus", () => {

    describe("AmqpBus", () => {

        describe("formatAmqpUrl", () => {

            it("should correctly expose the function", () => {

                expect(formatAmqpUrl).to.be.an.instanceOf(Function);
            });

            it("should return a provided string unmodified", () => {

                const options = "this one";
                const expected = options;

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should return the value of opts.url unmodified", () => {

                const options = { url: "this two" };
                const expected = options.url;

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the defaults when no values are provided", () => {

                const options = null;
                const expected = "amqp://localhost:5672";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });


            it("should use the protocol when provided", () => {

                const options = { protocol: "amqps" };
                const expected = "amqps://localhost:5672";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the hostname when provided", () => {

                const options = { host: "myHost" };
                const expected = "amqp://myHost:5672";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the port when provided", () => {

                const options = { port: 1337 };
                const expected = "amqp://localhost:1337";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the username when provided", () => {

                const options = { username: "myUser" };
                const expected = "amqp://myUser@localhost:5672";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the username and password when provided", () => {

                const options = { username: "myUser", password: "myPass" };
                const expected = "amqp://myUser:myPass@localhost:5672";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });

            it("should use the vhost when provided", () => {

                const options = { vhost: "myVhost" };
                const expected = "amqp://localhost:5672/myVhost";

                let res;
                const doTest = () => {
                    res = formatAmqpUrl(options);
                };

                expect(doTest).to.not.throw();
                expect(typeof res).to.equal("string");
                expect(res).to.equal(expected);
            });
        });
    });
});
