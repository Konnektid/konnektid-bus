Konnektid-Bus
=============

This module provides an interface for inter-process communication. The messaging system is backed by RabbitMQ.

Available patterns to use are:
- Direct send/receive messages
- Sending of persisted messages
- Event publish/subscribe
- Remote procedure calls

Method overview
---------------

### KndBus.create(options)
Creates a new instance of Konnektid-bus. Available options are:

- `amqp` (object): Required. The AMQP configuration for the running instance of RabbitMQ.
    - `amqp.host` (string): The host to use. Defaults to localhost.
    - `amqp.username` (string): The username to use.
    - `amqp.password` (string): The password to use.
    - `amqp.port` (Number): The port to use.
    - `amqp.vhost` (string): The VHost to use.
- `timeout` (number): Optional. The number of milliseconds before a message or RPC expires. Defaults to 10000 (10 seconds).

### send(name[, payload])
Sends a direct message to a (single) listening process.

- `name` (string): Required. The name of the message to send.
- `payload` (any): Optional payload to send with the message.

### listen(name, handler)
Listens to messages send with `send`. Load balanced.

- `name` (string): Required. The name of the messages to receive.
- `handler` (function): Required. The function to run when receiving the message. Takes exactly one argument; the payload of the message if available.

### sendTask(name[, payload])
Sends a direct message to a (single) listening process. Unlike the `send` method, messages send with this method are persisted until it is recieved by a process.

- `name` (string): Required. The name of the message to send.
- `payload` (any): Optional payload to send with the message.

### listenTask(name, handler)
Listens to messages send with `sendTasks`. Load balanced. Unlike the `listen` method, messages can be recieved that were send before the `listenTask` function was called.

- `name` (string): Required. The name of the messages to receive.
- `handler` (function): Required. The function to run when receiving the message. Takes exactly one argument; the payload of the message if available.

### publish(name[, payload])
Publishes an event to the bus.

- `name` (string): Required. The name of the event to emit.
- `payload` (any): Optional payload to send with the event.

### subscribe(name, handler)
Subscribes to and handles events that are emitted to the bus.

- `name` (string): Required. Event name to listen for.
- `handler` (function): Required. Function to run when receiving the event. Takes exactly one argument; the payload of the event if available.

### call(name[, payload])
Calls a remote procedure with optional arguments and waits for a reply.

- `name` (string): Required. The name of the service to call.
- `payload` (any): Optional data to send with the service call.

Returns a promise that either resolves with the answer or rejects with an error from the RPC server.

### reply(name, handler)
Listens for and replies to a remote procedure call.

- `name` (string): Required. Name of the procedure to handle.
- `handler` (function): Required. Function to process the call. Takes 1 argument: The payload of the caller. Should return a promise.

Basic initialisation
--------------------

To initialise, require the module and create a new instance of the bus by passing the required options:

    const KnBus = require("konnektid-bus");
    const bus = KndBus.create({
        amqp: { url: "amqp://localhost:5672/" },
        timeout: 10000
    });

Where `url` is the url to your running RabbitMQ process. You can also use an object with keys `protocol`, `host`, `username`, `password`, `port`, `vhost` instead. Optionally, you can pass a `timeout` property that defines the number of milliseconds before a message or RPC expires. By default this is set to `10000` (10 seconds).

Direct send/listen
-------------------

The most basic pattern available. One process sends a message with optional payload, the other receives it. If multiple processes listen for the same message name, only one of them will receive it. Load balancing occurs in a round-robin fashion.
Note that messages will be dropped if no process is listening for messages with the provided name.

Sending:

    const bus = KndBus.create( ... );
    bus.send("messageName, "world!");

Receiving:

    const bus = KndBus.create( ... );
    bus.listen("messageName", payload => {
        
        console.log("Hello", payload); // => logs `Hello world!` 
    });
    
The payload can be of any type that can be serialised into JSON format, so it's safe to pass any primitive, or multiple values as an object literal.
    
Persisted sendTask/listenTask
-----------------------------

Very similar to the direct `send()`/`listen()` methods, but messages are not dropped from the queue when there are no active consumers listening. Useful for jobs that need to be handled at some point in the future.

Sending:

    const bus = KndBus.create( ... );
    bus.sendTask("taskName, "world!");
    
Receiving:

    const bus = KndBus.create( ... );
    bus.listenTask("taskName", payload => {
        
        console.log("Hello", payload); // => logs `Hello world!` 
    });

    
Event publish/subscribe
-----------------------
    
You can use the bus to publish and subscribe to events in the application. If multiple processes subscribe to the same event, they will all receive the message.

In order to publish a method:

    const bus = KndBus.create( ... );
    bus.publish("somethingHappened", { x: 1, y: 2, z: 4 });
    
And to subscribe:

    const bus = KndBus.create( ... );
    bus.subscribe("somethingHappened", payload => {
    
        console.log(payload.x, payload.y, payload.z); // => logs `1 2 4`
    });
    
Konnektid-bus also exports an alias for the `publish()` method as `emit()` and the `subscribe()` method as `on()`, so this module can be (nearly) used as a drop in replacement of the default NodeJS EventEmitter.

Remote procedure call (RPC)
---------------------------

The RPC methods are convenience wrappers around (multiple) `send()` and `listen()` calls. They take care of contacting another process and making sure the calling process is able to receive a reply. Like the direct send/listen methods, multiple calls to `reply()` with the same service name will cause the RPC to be load balanced over the available processes.

Exposing a service over the bus:

    const bus = KndBus.create( ... );
    bus.reply("serviceName", params => {
    
        // return error 
        if (!params)
            return Promise.reject({ err: true, message: "Parameters missing" }); // note that new Error() is not serialisable
            
        // return result
        return Promise.resolve("Reply");
    });
    
Because these methods are based on `send()` and `listen()`, the `params` value can contain any data type that can be serialised.
Be sure that the returned Promise holds a value that can be serialised as well, returning object instances (e.g. an Error instance) is not supported.

Calling a service over the bus:

    const bus = KndBus.create( ... );
    bus.call("serviceName", { param1: "hello", param2: "world" })
    .then(res => {
    
        // success!
        console.log(res);
        
    })
    .catch(err => {
    
        // call failed
        throw new Error("RPC failed: " + err.message);
    });
    
The second parameter can be omitted if the called service does not require any parameters. If no reply is received within the defined timeout limit (10 seconds by default), a `TimeoutError` will be passed to the first parameter of your callback function.

Example usage
-------------

Check the `./examples` folder to see how to use the three patterns:

- Run `direct` for direct message communication (using `send()` and `listen()`)
- Run `task` for persisted direct message communication (using `sendTask()` and `listenTask()`)
- Run `event` for event publishing and subscribing (using `publish()` and `subscribe()`)
- Run `rpc` for remote procedure calls (using `call()` and `reply()`)