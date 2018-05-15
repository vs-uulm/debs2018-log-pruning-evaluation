// hierarchical
const mergeMap = new Map();
const windowMap = new Map();

require('..')((entry, config) => {
    if (!windowMap.has(entry.actorId)) {
        mergeMap.set(entry.actorId, []);
        windowMap.set(entry.actorId, [[]]);
    }

    const windows = windowMap.get(entry.actorId);
    // enqueue new entry to the first window
    windows[0].unshift([entry.localClock]);

    for (let i = 0; ; i++) {
        if (windows.length === i) {
            break;
        }

        const mergeSize = Math.pow(2, i);

        if (windows[i].length > 1) {
            if (windows[i][1].length < mergeSize) {
                // merge the first two entries in this window
                let merged = [
                    ...windows[i].shift(),
                    ...windows[i].shift()
                ];

                windows[i].unshift(merged);
            }
        }

        if (windows[i].length > config.k) {
            if (windows.length <= (i + 1)) {
                // add new window
                windows.push([]);
            }

            // move last entry to next window
            windows[i + 1].unshift(windows[i].pop());
        }
    }
}, null, (entry) => {
    const windows = windowMap.get(entry.actorId);
    const window = windows[windows.length - 1];
    const mergeSet = window[window.length - 1];
    mergeSet.pop();

    if (mergeSet.length === 0) {
        const mergedEvent = mergeMap.get(entry.actorId);
        mergedEvent.push(entry.event);
        if (mergedEvent.length > 1) {
            // merge events
            entry.event = JSON.stringify(mergedEvent.map(JSON.parse).reduce((a, v) => a.concat(v), []));

            // discard commands, if something was merged
            entry.command = '';
        }

        mergeMap.set(entry.actorId, []);
        entry.checkpoint = '';

        // discard empty merge set
        window.pop();
        if (window.length === 0) {
            windows.pop();
        }

        return entry;
    } else {
        // prune entry
        mergeMap.get(entry.actorId).push(entry.event);
        return;
    }
});
