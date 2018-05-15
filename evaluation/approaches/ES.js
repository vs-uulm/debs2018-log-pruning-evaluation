// only event sourcing
require('..')(null, null, (entry) => {
    entry.command = '';
    entry.checkpoint = '';

    return entry;
});
