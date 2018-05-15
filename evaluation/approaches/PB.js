// probabilistic
const Random = require('random-js');
const Prob = require('prob.js');

const mt = Random.engines.mt19937().seed(12345);
const random = new Random(mt);
random.zipf = N => Prob.zipf(1, N)(mt);

const merge = new Map();
const prune = new Set();

require('..')((entry, config) => {
    const clock = parseInt(entry.localClock, 10);

    if (clock > 0 && random.real(0, 1) <= config.p) {
        // select random previous entry to merge
        const target = random.zipf(clock) - 1;
        prune.add(`${entry.actorId}.${target}`);
    }
}, null, (entry) => {
    const clock = parseInt(entry.localClock, 10);

    if (prune.has(`${entry.actorId}.${clock}`)) {
        prune.delete(`${entry.actorId}.${clock}`);

        let mergeSet = [];
        if (merge.has(`${entry.actorId}.${clock}`)) {
            mergeSet = merge.get(`${entry.actorId}.${clock}`);
            merge.delete(`${entry.actorId}.${clock}`);
        }

        mergeSet.push(entry.event);
        merge.set(`${entry.actorId}.${clock + 1}`, mergeSet);

        // prune event
        return;
    } else if (merge.has(`${entry.actorId}.${clock}`)) {
        const mergeSet = merge.get(`${entry.actorId}.${clock}`);
        merge.delete(`${entry.actorId}.${clock}`);
        mergeSet.push(entry.event);

        // merge events and discard command
        entry.event = JSON.stringify(mergeSet.map(JSON.parse).reduce((a, v) => a.concat(v), []));
        entry.checkpoint = '';
        entry.command = '';
    } else {
        // normal event and command sourcing
        entry.checkpoint = '';
    }

    return entry;
});
