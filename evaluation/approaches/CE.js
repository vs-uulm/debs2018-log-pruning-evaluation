// combined command and event sourcing
require('..')(null, null, (entry) => {
    entry.checkpoint = '';

    return entry;
});
