const v8 = require('v8');

const getSize = val => val.length > 0 ? v8.serialize(JSON.parse(val)).length : 0;

require('.')(null, null, (entry) => {
    entry.event = getSize(entry.event);
    entry.command = getSize(entry.command);
    entry.checkpoint = getSize(entry.checkpoint);

    return entry;
});
