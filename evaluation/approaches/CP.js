// only checkpointing
const clocks = {};
require('..')((entry) => {
    clocks[entry.actorId] = entry.localClock;
}, null, (entry) => {
    if (entry.localClock !== clocks[entry.actorId]) {
        // only save last checkpoint of each actor
        return;
    }

    entry.command = '';
    entry.event = '';

    return entry;
});
