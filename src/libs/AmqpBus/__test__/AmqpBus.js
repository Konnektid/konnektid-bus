"use strict";

const expect = require("chai").expect;
const mockery = require("mockery");
const sinon = require("sinon");

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
});

const fakeMessage = {
    content: new Buffer("7b2268656c6c6f223a22776f726c64227d", "hex"),
    properties: { correlationId: "CID-1" }
};

const noop = () => Promise.resolve();
const fakeChannel = {
    assertQueue: () => Promise.resolve({ queue: "queueID" }),
    assertExchange: () => Promise.resolve({ exchange: "exchangeID" }),
    bindQueue: noop,
    sendToQueue: noop,
    publish: noop,
    consume: (name, cb) => {  cb && cb(fakeMessage); return Promise.resolve(); },
    ack: noop,
    prefetch: noop,
    close: noop
};
const fakeConnection = {
    createChannel: () => Promise.resolve(fakeChannel),
    close: noop
};
const fakeAmqplib = {
    connect: () => Promise.resolve(fakeConnection)
};

const assertQueueSpy = sinon.spy(fakeChannel, "assertQueue");
const assertExchangeSpy = sinon.spy(fakeChannel, "assertExchange");
const bindQueueSpy = sinon.spy(fakeChannel, "bindQueue");
const sendToQueueSpy = sinon.spy(fakeChannel, "sendToQueue");
const publishSpy = sinon.spy(fakeChannel, "publish");
const consumeSpy = sinon.spy(fakeChannel, "consume");
const ackSpy = sinon.spy(fakeChannel, "ack");
const prefetchSpy = sinon.spy(fakeChannel, "prefetch");
const closeChannelSpy = sinon.spy(fakeChannel, "close");

const createChannelSpy = sinon.spy(fakeConnection, "createChannel");
const closeConnectionSpy = sinon.spy(fakeConnection, "close");

const connectSpy = sinon.spy(fakeAmqplib, "connect");

mockery.registerMock("amqplib", fakeAmqplib);
const AmqpBus = require("../AmqpBus.js");

const busPublishSpy = sinon.spy(AmqpBus.prototype, "publish");
const busSubscribeSpy = sinon.spy(AmqpBus.prototype, "subscribe");

describe("konnektid-bus", () => {

    describe("AmqpBus", () => {

        afterEach(() => {
            assertQueueSpy.reset();
            assertExchangeSpy.reset();
            bindQueueSpy.reset();
            sendToQueueSpy.reset();
            publishSpy.reset();
            consumeSpy.reset();
            ackSpy.reset();
            prefetchSpy.reset();
            closeChannelSpy.reset();

            createChannelSpy.reset();
            closeConnectionSpy.reset();

            connectSpy.reset();

            busPublishSpy.reset();
            busSubscribeSpy.reset();
        });

        describe("Constructor", () => {

            it("should correctly create the AmqpBus instance", () => {

                let bus;
                const doTest = () => {
                    bus = new AmqpBus({ amqp: {} });
                };

                expect(doTest).to.not.throw();
                expect(bus).to.be.an.instanceOf(AmqpBus);
            });
        });

        describe("connect", () => {

            it("should connect with amqplib", () => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    bus.connect();
                };

                expect(connectSpy.callCount).to.equal(0);
                expect(doTest).to.not.throw();
                expect(connectSpy.callCount).to.equal(1);
            });

            it("should only connect once", done => {

                let connected = 0;
                const finishConnect = () => {

                    connected++;
                    if (connected === 3) {
                        expect(connectSpy.callCount).to.equal(1);
                        done();
                    }
                };

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });

                    bus.connect().then(finishConnect);
                    bus.connect().then(finishConnect);
                    bus.connect().then(finishConnect);
                };

                expect(connectSpy.callCount).to.equal(0);
                expect(doTest).to.not.throw();
            });
        });

        describe("close", () => {

            it("should disconnect with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    bus.connect()
                    .then(() => bus.close())
                    .then(() => {
                        expect(closeChannelSpy.callCount).to.equal(1);
                        expect(closeConnectionSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(connectSpy.callCount).to.equal(0);
                expect(closeChannelSpy.callCount).to.equal(0);
                expect(closeConnectionSpy.callCount).to.equal(0);
                expect(doTest).to.not.throw();
                expect(connectSpy.callCount).to.equal(1);
            });

            it("should only close once", done => {

                let closed = 0;
                const finishClose = () => {

                    closed++;
                    if (closed === 3) {
                        expect(closeChannelSpy.callCount).to.equal(1);
                        expect(closeConnectionSpy.callCount).to.equal(1);
                        done();
                    }
                };

                const doTest = () => {

                    const bus = new AmqpBus({ amqp: {} });
                    bus.connect().then(() => {

                        bus.close().then(finishClose);
                        bus.close().then(finishClose);
                        bus.close().then(finishClose);
                    });
                };

                expect(closeChannelSpy.callCount).to.equal(0);
                expect(closeConnectionSpy.callCount).to.equal(0);
                expect(doTest).to.not.throw();
            });
        });

        describe("_getChannel", () => {

            it("should connect and create the channel with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    bus._getChannel()
                    .then(() => {
                        expect(connectSpy.callCount).to.equal(1);
                        expect(createChannelSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("send", () => {

            it("should send the message with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.send()
                    .then(() => {
                        expect(sendToQueueSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("listen", () => {

            it("should listen for the message with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.listen("q", noop)
                    .then(() => {
                        expect(consumeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("sendTask", () => {

            it("should send the persisted message with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.sendTask()
                    .then(() => {
                        expect(sendToQueueSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("listenTask", () => {

            it("should listen for the persisted message with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.listenTask("q", noop)
                    .then(() => {
                        expect(consumeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("publish", () => {

            it("should broadcast the event with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.publish()
                    .then(() => {
                        expect(publishSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("subscribe", () => {

            it("should subscribe to the event with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.subscribe("e", noop)
                    .then(() => {
                        expect(consumeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("emit", () => {

            it("should proxy to AmqpBus.publish", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.emit()
                    .then(() => {
                        expect(busPublishSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("on", () => {

            it("should proxy to AmqpBus.subscribe", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.on("e", noop)
                    .then(() => {
                        expect(busSubscribeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("reply", () => {

            it("should listen for RPC calls with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {} });
                    return bus.reply("r", noop)
                    .then(() => {
                        expect(consumeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });

        describe("call", () => {

            it("should do a RPC call with amqplib", done => {

                const doTest = () => {
                    const bus = new AmqpBus({ amqp: {}, timeout: 10 });
                    return bus.call()
                    .catch(err => {
                        expect(err.name).to.equal("TimeoutError");
                        expect(sendToQueueSpy.callCount).to.equal(1);
                        expect(consumeSpy.callCount).to.equal(1);
                        done();
                    });
                };

                expect(doTest).to.not.throw();
            });
        });
    });
});
