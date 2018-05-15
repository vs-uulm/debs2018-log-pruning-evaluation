const fs = require('fs');
const path = require('path');
const ProgressBar = require('progress');
const jsonpatch = require('fast-json-patch');

// parse arguments
if (process.argv.length < 4) {
    console.log('Usage:', process.argv.join(' '), 'CONFIG_FILE EVENTLOG_FILE');
    process.exit(1);
}

// read config
const config = require(path.resolve(process.argv[2]));

// load random helper
const random = require('./random.js')(config);

// open write stream for log file
const writer = fs.createWriteStream(process.argv[3]);

// progress meter
const bar = new ProgressBar(':bar', { total: config.eventCount });

// actor state map
const actors = {};

// actor clock map
let globalClock = 0;
const actorClocks = {};

// write log entry
const csvify = (val) => `"${JSON.stringify(val).replace(/"/g, '""')}"`;
const persistEntry = (id, command, oldState, newState) => {
    writer.write([
        globalClock++,
        id,
        actorClocks[id]++,
        csvify(command),
        csvify(jsonpatch.compare(oldState, newState)),
        csvify(newState)
    ].join(','));
    writer.write('\n');

    bar.tick();
    config.eventCount -= 1;
}

// todo initialize actors
for (let key of Object.keys(config.services)) {
    const service = config.services[key];

    for (let i = 0; i < service.scale; i++) {
        const id = `${key}-${i}`;
        actors[id] = random.json(service.stateTemplate);
        actorClocks[id] = 0;

        // persist initial checkpoint/event
        persistEntry(id, { type: 'bootstrap' }, {}, actors[id]);
    }
}

// command queue
const queue = [];

const run = () => {
    for (let i = 0; i < 100 && (config.eventCount > 0 || queue.length > 0); i++) {
        // choose a random command, biased towards commands that have been longer in the queue 
        const index = Math.round((1 - Math.sqrt(1 - random.real(0, 1))) * (queue.length));

        if (index === queue.length) {
            // schedule a new external request
            const command = {
                id: random.uuid4(),
                type: random.weightedPick(config.requestTypes),
                receiver: random.weightedPick(config.requestReceiver),
                payload: random.json(config.commandTemplate)
            };

            // do not queue the request when the log already reached the desired size
            if (config.eventCount > 0) {
                queue.push(command);
            }
        } else {
            // remove and process a command from the queue
            const command = queue.splice(index, 1)[0];
            // console.log('processing', command);

            let receiver = !command.receiver.includes('-')
                ? `${command.receiver}-${random.integer(0, config.services[command.receiver].scale - 1)}`
                : command.receiver;

            // retrieve state of the receiving actor
            const state = actors[receiver];
            const newState = JSON.parse(JSON.stringify(state));
            const outgoing = config.services[receiver.split('-', 1)[0]].behavior(command, newState, config, random);

            if (outgoing !== undefined && Array.isArray(outgoing)) {
                outgoing.forEach((msg) => {
                    msg.sender = receiver;
                    queue.push(msg);
                });
            }

            // store new state
            actors[receiver] = newState;

            // persist event, command, and checkpoint
            persistEntry(receiver, command, state, newState);
        }
    }

    if (config.eventCount > 0 || queue.length > 0) {
        setImmediate(run);
    } else {
        writer.once('close', () => {
            const nameParts = process.argv[3].split('.');
            const extension = nameParts.pop();
            const newName = `${nameParts.join('.')}-${globalClock}.${extension}`;
            fs.renameSync(process.argv[3], newName);
        });
        writer.end();
    }
}
run();
