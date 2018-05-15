const fs = require('fs');
const csv = require('csv-parser');
const { Transform } = require('stream');

if (process.argv.length < 4) {
    console.log('Usage:', process.argv.join(' '), 'EVENTLOG_FILE RESULT_FILE');
    process.exit(1);
}

const step = parseInt(process.env.STEP, 10);
const steps = parseInt(process.env.STEPS, 10);
const approachConfig = process.env.CONFIG.split(',').reduce((a, v) => {
    const parts = v.split('=');
    if (parts.length === 2) {
        a[parts[0]] = parseFloat(parts[1]);
    }
    return a;
}, {});

const csvConfig = {
    headers: ['globalClock', 'actorId', 'localClock', 'command', 'event', 'checkpoint']
};

const logFile = process.argv[2];
const resultFile = process.argv[3];

let breakClock = -1;
if (steps) {
    const maxGlobalClock = logFile.split('-').pop().split('.').shift();
    breakClock = Math.ceil(maxGlobalClock * step / steps);
}

const csvify = (val) => val.length > 0 ? `"${val.replace(/"/g, '""')}"` : val;

module.exports = (firstPass, transition, secondPass) => {
    const writer = fs.createWriteStream(resultFile);

    const finalPass = () => {
        const stream = fs.createReadStream(logFile);
        const transformer = new Transform({
            writableObjectMode: true,

            transform: (chunk, encoding, callback) => {
                if (breakClock < 0 || parseInt(chunk.globalClock, 10) <= breakClock) {
                    const result = secondPass(chunk, approachConfig);

                    if (result === undefined) {
                        callback(null);
                    } else {
                        callback(null, `${result.globalClock},${result.actorId},${result.localClock},${csvify(result.command)},${csvify(result.event)},${csvify(result.checkpoint)}\n`);
                    }
                } else {
                    stream.unpipe();
                    stream.destroy();
                    callback(null);
                }
            }
        });
        stream.pipe(csv(csvConfig)).pipe(transformer).pipe(writer);
    };

    if (firstPass) {
        let ended = false;
        const proceed = () => {
            if (!ended) {
                ended = true;
                if (transition) {
                    transition(approachConfig);
                }
                finalPass();
            }
        }

        const stream = fs.createReadStream(logFile);
        stream.on('error', proceed);
        stream.pipe(csv(csvConfig))
            .on('data', (chunk) => {
                if (breakClock < 0 || parseInt(chunk.globalClock, 10) <= breakClock) {
                    firstPass(chunk, approachConfig)
                } else {
                    stream.destroy('destroyed');
                }
            })
            .on('end', proceed);
    } else {
        finalPass();
    }
};
