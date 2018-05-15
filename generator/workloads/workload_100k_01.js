const valueTemplate = `{
    "id": {{@index}},
    "name": "{{firstName}} {{lastName}}",
    "work": "{{company}}",
    "email": "{{email}}",
    "dob": "{{date '1900' '2000' 'YYYY'}}",
    "address": "{{int 1 100}} {{street}}",
    "city": "{{city}}",
    "optedin": {{boolean}}
}`;

const config = {
    eventCount: 100000,
    seed: 'bb4a4141-47aa-4eee-a2e7-9e48a298b563',
    requestTypes: {
        'read-heavy': 0.5,
        'read-write': 0.2,
        'compute-heavy': 0.2,
        'compute-write': 0.1,
    },
    requestReceiver: ['LB'],
    commandTemplate: `{
        "boolean": {{boolean}},
        "int": "{{int -65536 65535}}",
        "float": {{float 0 1}},
        "string": "{{text 2 16}}"
    }`,
    services: {
        LB: {
            scale: 1,
            stateTemplate: '{ "lastReceiver": 0 }',
            behavior: (command, state, config, random) => {
                // filter out responses, because they are only passed on to an external entity that is not modeled in our simulation
                if (command.type !== 'response') {
                    // round-robin to balance requests across request handlers
                    state.lastReceiver = (state.lastReceiver + 1) % config.services.RH.scale;

                    return [{
                        ...command,
                        receiver: `RH-${state.lastReceiver}`
                    }];
                }
            }
        },
        RH: {
            scale: 16,
            stateTemplate: '{ "awaiting": {} }',
            properties: {
                'read-heavy': {
                    BSC: [0, 2],
                    BSSR: [5, 10],
                    BSSW: [0, 0],
                    BSL: [1, 1]
                },
                'read-write': {
                    BSC: [0, 2],
                    BSSR: [3, 6],
                    BSSW: [3, 6],
                    BSL: [1, 1]
                },
                'compute-heavy': {
                    BSC: [3, 6],
                    BSSR: [2, 4],
                    BSSW: [1, 3],
                    BSL: [1, 2]
                },
                'compute-write': {
                    BSC: [3, 6],
                    BSSR: [2, 4],
                    BSSW: [2, 5],
                    BSL: [1, 2]
                }
            },
            behavior: (command, state, config, random) => {
                if (command.type === 'response') {
                    const requestId = command.id.split('.', 1)[0];

                    // remove response from awaiting list
                    state.awaiting[requestId].splice(state.awaiting[requestId].indexOf(command.id), 1);

                    // when all responses where gathered, send response back to LB
                    if (state.awaiting[requestId].length === 0) {
                        delete state.awaiting[requestId];
                        return [{
                            id: requestId,
                            type: 'response',
                            receiver: 'LB',
                            payload: random.json(config.commandTemplate)
                        }];
                    }
                } else {
                    const props = config.services.RH.properties[command.type];
                    const counts = Object.keys(props).reduce((o, k) => {
                        o[k] = random.integer(props[k][0], props[k][1]);
                        return o;
                    }, {});

                    state.awaiting[command.id] = [];

                    return Object.keys(counts).reduce((a, k, i) => {
                        const id = `${command.id}.${i}`;
                        if (k !== 'BSL') {
                            state.awaiting[command.id].push(id);
                        }

                        let type = command.type;
                        if (k === 'BSSR') {
                            type = 'read';
                        } else if (k === 'BSSW') {
                            type = 'write';
                        }

                        a.push({
                            id: id,
                            type: type,
                            receiver: k.substr(0, 3),
                            payload: random.json(config.commandTemplate)
                        });

                        return a;
                    }, []);
                }
            }
        }, 
        BSC: {
            scale: 24,
            stateTemplate: '{ "lastCommand": {} }',
            behavior: (command, state, config, random) => {
                // store last command and reply to RH
                state.lastCommand = command;
                return [{
                    id: command.id,
                    type: 'response',
                    receiver: command.sender,
                    payload: random.json(config.commandTemplate)
                }];
            }
        },
        BSS: {
            scale: 20,
            stateTemplate: `{
                "store": {
                    {{#repeat 4 20}}
                    "{{guid}}": [
                        {{#repeat 2 6}}
                            ${valueTemplate}
                        {{/repeat}}
                    ]
                    {{/repeat}}
                },
                "distribution": "{{distribution}}"
            }`,
            properties: {
                valueTemplate: `[{{#repeat %COUNT%}} ${valueTemplate} {{/repeat}}]`
            },
            behavior: (command, state, config, random) => {
                if (command.type === 'read') {
                    // return random value of state
                    const key = (state.distribution === 'heavy-tail')
                        ? Object.keys(state.store)[random.zipf(Object.keys(state.store).length) - 1]
                        : Object.keys(state.store)[random.integer(0, Object.keys(state.store).length - 1)];

                    // reply to RH
                    return [{
                        id: command.id,
                        type: 'response',
                        receiver: command.sender,
                        payload: state.store[key]
                    }];
                } else {
                    // create value with 2-10 entries (bias towards less entries)
                    const value = random.json(config.services.BSS.properties.valueTemplate.replace(
                        '%COUNT%',
                        random.zipf(10)
                    ));

                    // coin flip, if update or insert
                    if (random.bool()) {
                        // update random value of state with random value
                        const key = (state.distribution === 'heavy-tail')
                            ? Object.keys(state.store)[random.zipf(Object.keys(state.store).length) - 1]
                            : Object.keys(state.store)[random.integer(0, Object.keys(state.store).length - 1)];

                        state.store[key] = value;
                    } else {
                        // insert random value at random key
                        const key = random.uuid4();
                        state.store[key] = value;
                    }

                    // reply to RH
                    return [{
                        id: command.id,
                        type: 'response',
                        receiver: command.sender,
                        payload: random.json(config.commandTemplate)
                    }];
                }
            }
        },
        BSL: {
            scale: 3,
            stateTemplate: '[]',
            behavior: (command, state, config, random) => {
                // just append command to state, response is not necessary
                state.push(command);
            }
        }
    }
};

module.exports = config;
