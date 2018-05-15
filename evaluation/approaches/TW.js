// tumbling window
const clocks = {};
require('..')((entry) => {
    clocks[entry.actorId] = entry.localClock;
}, (config) => {
    for (let key of Object.keys(clocks)) {
        clocks[key] = Math.max(parseInt(clocks[key], 10) - config.k - 1, 0);
    }
}, (entry, config) => {
    const clock = parseInt(entry.localClock, 10);
    if (clock < clocks[entry.actorId]) {
        if (clock % config.w === clocks[entry.actorId] % config.w) {
            // compact to checkpoint every w-th entry
            entry.command = '';
            entry.event = '';
        } else {
            // prune event
            return;
        }
    } else if (clock === clocks[entry.actorId]) {
        // store only checkpoint
        entry.command = '';
        entry.event = '';
    } else if (clock > clocks[entry.actorId]) {
        // normal event and command sourcing
        entry.checkpoint = '';
    }

    return entry;
});
