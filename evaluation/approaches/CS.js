// only command sourcing
require('..')(null, null, (entry) => {
    if (parseInt(entry.localClock, 10) > 0) {
        entry.checkpoint = '';
    }
    entry.event = '';

    return entry;
});
