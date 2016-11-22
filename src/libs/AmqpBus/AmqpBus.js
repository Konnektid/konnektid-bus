/**
 * Konnektid - KonnektidBus
 *
 * Copyright(c) 2015 Konnektid
 * All rights reserved.
 *
 * @author Tijn Kersjes <tijn@divbyzero.nl>
 */
"use strict";

// dependencies
const EventEmitter = require("events").EventEmitter;
const amqplib = require("amqplib");
const uuid = require("node-uuid");

// lib
const Errors = require("../Errors");
const formatAmqpUrl = require("./formatAmqpUrl");
const payloadFormatter = require("./payloadFormatter");

// queue and exchange options
const ACK = { noAck: false };
const DURABLE = { durable: true };
const NOT_DURABLE_AUTO_DELETE = { durable: false, autoDelete: true };
const EXCLUSIVE = { exclusive: true };
const PERSISTENT = { persistent: true };
const NOT_PERSISTENT = { persistent: false };
const FANOUT = "fanout";

class AmqpBus {

    /**
     * @param {object}          config          the configuration to use
     * @param {object|string}   config.amqp     the amqp configuration to use. Either the connection URL or object
     *                                          with optional keys { protocol, host, username, password, port, vhost }
     * @param {number=}         config.timeout  number of milliseconds after which a message (RPC calls) expires
     *
     * @constructor
     */
    constructor(config) {

        this.events = new EventEmitter();
        this.events.setMaxListeners(0);

        this.url = formatAmqpUrl(config.amqp);
        this.timeout = config.timeout || 30000;

        this.connection = null;
        this.channel = null;
        this.channelConnecting = false;

        this.replyQueue = null;
        this.replyQueueConnecting = false;
    }

    /**
     * Connects to the AMQP server and creates a channel to use
     * Emits `connection`, `channel` and `ready` events on this.events
     *
     * If already connected (or busy connecting), this function does not do anything.
     *
     * @returns {Promise}                   Resolves when connected
     */
    connect() {

        if (this.channelConnecting) {
            return new Promise(resolve => {
                this.events.on("ready", () => resolve());
            });
        }

        this.channelConnecting = true;

        return amqplib.connect(this.url)
        .then(conn => {
            this.connection = conn;
            this.events.emit("connection", conn);
            return conn.createChannel();
        })
        .then(chan => {
            this.channel = chan;
            this.events.emit("channel", chan);
            this.events.emit("ready");
        });
    }

    /**
     * Closes the channel and connection to the AMQP server
     *
     * @returns {Promise}                       Resolves when closed
     */
    close() {

        if (!this.channel) {

            if (!this.channelConnecting)
                return Promise.resolve();

            return new Promise(resolve => {
                this.events.on("channel", () => this.close().then(resolve));
            });
        }

        const conn = this.connection;
        const chan = this.channel;

        this.channelConnecting = false;

        this.connection = null;
        this.channel = null;

        return chan.close()
        .then(() => conn.close());
    }

    /**
     * Gets the channel to the AMQP server, establishing the connection first if none available
     *
     * @returns {Promise}               Resolves with the channel instance
     * @private
     */
    _getChannel() {

        if (this.channel)
            return Promise.resolve(this.channel);

        return new Promise(resolve => {

            this.events.on("channel", chan => resolve(chan));

            if (!this.channelConnecting)
                this.connect();
        });
    }

    /**
     * Gets the replyQueue to use for RPC calls,
     * establishing the connection first (and creating the replyQueue) if not available yet
     *
     * @returns {Promise}               Resolves with the replyQueue instance
     * @private
     */
    _getReplyQueue() {

        if (this.replyQueue)
            return Promise.resolve(this.replyQueue);

        return new Promise(resolve => {

            this.events.on("replyQueue", queue => resolve(queue));

            if (this.replyQueueConnecting)
                return;

            this.replyQueueConnecting = true;

            this._assertQueue("", EXCLUSIVE)
            .then(replyQueue => {

                this.replyQueue = replyQueue;
                this.events.emit("replyQueue", replyQueue);

                this._consumeFromReplyQueue();

                return replyQueue;
            });
        });
    }

    /**
     * Starts consuming from the replyQueue (if not done so already). Received messages will be emitted
     * as `reply-<CID>`, with <CID> being the correlationId of the received message.
     *
     * @returns {Promise}               Resolves with the consumer tag
     * @private
     */
    _consumeFromReplyQueue() {

        return this._getChannel()
        .then(chan => {

            return chan.consume(this.replyQueue, message => {

                chan.ack(message);

                const cid = message.properties.correlationId;
                this.events.emit("reply-" + cid, message);

            }, ACK);
        });
    }

    /**
     * Sets the prefetch count on the channel
     *
     * @param {number}                  count           the prefetch count
     *
     * @returns {Promise}                               resolves when completed
     * @private
     */
    _prefetch(count) {

        return this._getChannel()
        .then(chan => chan.prefetch(count));
    }

    /**
     * Acknowledge the received message
     *
     * @param {*}                       message         The received message to acknowledge
     *
     * @returns {Promise}                               Resolves when completed
     * @private
     */
    _ack(message) {

        return this._getChannel()
        .then(chan => chan.ack(message));
    }

    /**
     * Reject the received message
     *
     * @param {*}                       message         The received message to reject
     *
     * @returns {Promise}                               Resolves when completed
     * @private
     */
    _nack(message) {

        return this._getChannel()
        .then(chan => chan.nack(message));
    }

    /**
     * Asserts a queue with the given name and options.
     * Returns the existing queue if called twice with the same arguments.
     *
     * @param {string}              name            Name for the queue
     * @param {object=}             options         Optional options
     *
     * @returns {Promise}                           Resolves with the created queue
     * @private
     */
    _assertQueue(name, options) {

        return this._getChannel()
        .then(chan => chan.assertQueue(name, options))
        .then(res => res.queue);
    }

    /**
     * Asserts a queue with the given name, type and options.
     * Returns the existing exchange if called twice with the same arguments.
     *
     * @param {string}          name                Name for the exchange
     * @param {string}          type                Type of the exchange (e.g. `topic` or `fanout`)
     * @param {object=}         options             Optional options
     *
     * @returns {Promise}                           Resolves with the created exchange
     * @private
     */
    _assertExchange(name, type, options) {

        return this._getChannel()
        .then(chan => chan.assertExchange(name, type, options));
    }

    /**
     * Binds a queue to an exchange
     *
     * @param {Queue}           queue               Queue to bind
     * @param {Exchange}        exchange            Exchange to bind to
     * @param {string=}         pattern             Optional pattern to filter on
     *
     * @returns {Promise}                           Resolves when completed
     * @private
     */
    _bindQueue(queue, exchange, pattern) {

        return this._getChannel()
        .then(chan => chan.bindQueue(queue, exchange, pattern || ""));
    }

    /**
     * Sends a message directly to the queue with the given name
     *
     * @param {string}                  name            Name of the queue to send to
     * @param {object=}                 payload         Optional payload
     * @param {options=}                options         Optional options for the message
     *
     * @returns {Promise}                               Resolves when completed
     * @private
     */
    _sendToQueue(name, payload, options) {

        const data = payloadFormatter.encode(payload || {});

        return this._getChannel()
        .then(chan => chan.sendToQueue(name, data, options));
    }

    /**
     * Sends a message to an exchange
     *
     * @param {string}                  name            Name of the exchange to send to
     * @param {object=}                 payload         Optional payload
     * @param {object=}                 options         Optional options for the message
     *
     * @returns {Promise}                               Resolves when completed
     * @private
     */
    _sendToExchange(name, payload, options) {

        const data = payloadFormatter.encode(payload || {});

        return this._getChannel()
        .then(chan => chan.publish(name, "", data, options));
    }

    /**
     * Consumes directly a queue, firing the callback when a message is received.
     * When multiple consumers listen to the same queue, each message is received only once for all consumers,
     * RabbitMQ uses round-robin for this.
     *
     * @param {string}              name                Name of the queue to consume from
     * @param {Function}            handler             Function to call with the received data
     * @param {options=}            options             Optional options for the comsume action
     *
     * @returns {Promise}                               Resolves when completed
     * @private
     */
    _consumeFromQueue(name, handler, options) {

        return this._getChannel()
        .then(chan => {

            return chan.consume(name, message => {

                if (options && options.noAck === false)
                    chan.ack(message);

                const data = payloadFormatter.decode(message.content);
                handler(data, message);
            }, options)
            .then(res => ({

                cancel: () => chan.cancel(res.consumerTag)
            }));
        });
    }

    /**
     * Waits for a message with the given correlationId on the shared replyQueue and fires the callback with the received data
     *
     * @param {string}                  correlationId           CorrelationID to wait for
     * @param {Function}                handler                 Callback that receives the reply data
     *
     * @returns {Promise}                                       Resolves with { cancel: <Function> } when completed
     * @private                                                 Calling the `cancel` method will stop listening for the reply
     */
    _waitForReply(correlationId, handler) {

        const evName = "reply-" + correlationId;
        const evHandler = message => {

            const data = payloadFormatter.decode(message.content);
            handler(data, message);
        };

        this.events.once(evName, evHandler);

        return Promise.resolve({
            cancel: () => this.events.removeListener(evName, evHandler)
        });
    }

    /**
     * Sends a basic message to a listener
     *
     * @param {string}                  name                Name of the queue to send to
     * @param {object=}                 payload             Optional payload
     *
     * @returns {Promise}                                   Resolves when message was sent
     */
    send(name, payload) {

        // direct message
        const _name = "d" + name;
        return this._sendToQueue(_name, payload, NOT_PERSISTENT);
    }

    /**
     * Listens for basic messages from a sender
     *
     * @param {string}                  name                Name of the queue to listen to
     * @param {Function}                handler             Function to call with the received data
     *
     * @returns {Promise}                                   Resolved when listener is attached
     */
    listen(name, handler) {

        // direct message
        const _name = "d" + name;

        return this._assertQueue(_name, NOT_DURABLE_AUTO_DELETE)
        .then(() => this._consumeFromQueue(_name, data => handler(data), ACK));
    }

    /**
     * Sends a persisted message to a durable queue. Like `send()`, but messages will be persisted until a listener receives then.
     *
     * @param {string}                  name                Name for the queue to send to
     * @param {object=}                 payload             Optional payload
     *
     * @returns {Promise}                                   Resolves when the message was sent
     */
    sendTask(name, payload) {

        // persistent message
        const _name = "p" + name;

        return this._assertQueue(_name, DURABLE)
        .then(() => this._sendToQueue(_name, payload, PERSISTENT));
    }

    /**
     * Listens for persisted messages from a taskSender. Like `listen()`, but can receive (old) persisted messages.
     *
     * @param {string}                  name                Name of the durable queue to listen to
     * @param {Function}                handler             Function to call with the received data
     *
     * @returns {Promise}                                   Resolves when the listener is attached
     */
    listenTask(name, handler) {

        // persistent message
        const _name = "p" + name;

        return this._assertQueue(_name, DURABLE)
        .then(() => {

            this._prefetch(1);
            return this._consumeFromQueue(_name, data => handler(data), ACK);
        });
    }

    /**
     * Broadcasts an event to all subscribed consumers on the bus
     *
     * @param {string}                  name                Name of the event to publish
     * @param {object=}                 payload             Optional payload
     *
     * @returns {Promise}                                   Resolves when the event was emitted
     */
    publish(name, payload) {

        // event
        const _name = "e" + name;

        return this._assertExchange(_name, FANOUT, NOT_DURABLE_AUTO_DELETE)
        .then(() => this._sendToExchange(_name, payload));
    }

    /**
     * Subscribes to events from all publishers on the bus
     *
     * @param {string}                  name                Name of the event to subscribe to
     * @param {Function}                handler             Function to call with the received event data
     *
     * @returns {Promise}                                   Resolves when the listener is attached
     */
    subscribe(name, handler) {

        // event
        const _name = "e" + name;

        return this._assertExchange(_name, FANOUT, NOT_DURABLE_AUTO_DELETE)
        .then(() => this._assertQueue("", EXCLUSIVE))
        .then(queue => {

            return this._bindQueue(queue, _name, "")
            .then(() => this._consumeFromQueue(queue, data => handler(data), ACK));
        });
    }

    /**
     * @alias for publish
     */
    emit(name, payload) {
        return this.publish(name, payload);
    }

    /**
     * @alias for subscribe
     */
    on(name, handler) {
        return this.subscribe(name, handler);
    }

    /**
     * Performs a Remote Procedure Call and returns the result as returned from the RPC server.
     *
     * @param {string}                      name                Name of the RPC to call
     * @param {object=}                     payload             Optional payload for the call (i.e. arguments)
     *
     * @returns {Promise}                                       Resolves or rejects with the response/error from the RPC server
     *                                                          (or a `KndBus.TimeoutError` when the response took too long)
     */
    call(name, payload) {

        // rpc message
        const _name = "r" + name;

        return this._getReplyQueue()
        .then(replyQueue => {

            return new Promise((resolve, reject) => {

                const cid = uuid();
                let replyTimeout = null;

                this._waitForReply(cid, data => {

                    clearTimeout(replyTimeout);

                    if (data[0]) reject(data[0]);
                    else resolve(data[1]);
                })
                .then(listener => {

                    this._sendToQueue(_name, payload, {
                        correlationId: cid,
                        replyTo: replyQueue
                    });

                    replyTimeout = setTimeout(() => {

                        listener.cancel();
                        reject(new Errors.TimeoutError("RPC timeout exceeded"));
                    }, this.timeout);
                });
            });
        });
    }

    /**
     * Listens for a Remote Procedure Call and returns the result
     *
     * @param {string}                      name                Name of the RPC call to reply to
     * @param {Function}                    handler             Function that handles the call. Receives the optional payload
     *                                                          and is expected to return a Promise.
     *
     * @returns {Promise}                                       Resolves when the listener is attached
     */
    reply(name, handler) {

        // rpc message
        const _name = "r" + name;

        return this._assertQueue(_name, NOT_DURABLE_AUTO_DELETE)
        .then(() => {

            this._prefetch(1);

            return this._consumeFromQueue(_name, (data, message) => {

                const cid = message.properties.correlationId;
                const replyQueue = message.properties.replyTo;

                let handleTimeout = setTimeout(() => {

                    handleTimeout = null;
                    this._nack(message);
                }, this.timeout);

                handler(data)
                .then(res => {

                    if (!handleTimeout) return;
                    clearTimeout(handleTimeout);

                    this._ack(message);
                    this._sendToQueue(replyQueue, [0, res], { correlationId: cid });
                })
                .catch(err => {

                    if (!handleTimeout) return;
                    clearTimeout(handleTimeout);

                    this._ack(message);
                    this._sendToQueue(replyQueue, [err], { correlationId: cid });
                });
            });
        });
    }
}

// export the class
module.exports = AmqpBus;