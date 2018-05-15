const dummyjson = require('dummy-json');
const QuickLRU = require('quick-lru');
const Random = require('random-js');
const crypto = require('crypto');
const Prob = require('prob.js');

module.exports = (config) => {
    // initialize rng
    const mt = Random.engines.mt19937().seed(
        crypto
            .createHash('md5')
            .update(config.seed)
            .digest('hex')
            .match(/.{1,8}/g)
            .map(x => parseInt(x, 16))
    );
    const r = new Random(mt);

    // pick a element from a weighted or unweighted array
    r.weightedPick = (weights) => {
        if (Array.isArray(weights)) {
            // uniformly pick a random element
            return r.pick(weights);
        } else {
            // object keys represent values, values represent weights
            let sum = 0;
            const dist = new Map();
            for (const [k, p] of Object.entries(weights)) {
                if (p > 0) {
                    dist.set(sum + p, k);
                }
                sum += p;
            }

            const x = r.real(0, sum);
            for (const [p, e] of dist) {
                if (x <= p) {
                    return e;
                }
            }
        }
    };

    // generate a random json according to the specified template
    const jsonHelpers = {
        distribution: () => dummyjson.utils.randomArrayItem(['heavy-tail', 'uniform']),
        text: (min, max) => dummyjson.helpers.lorem(dummyjson.utils.randomInt(min, max), {
            data: {
                root: {
                    lorem: dummyjson.mockdata.lorem
                }
            }
        })
    };
    r.json = (template) => JSON.parse(dummyjson.parse(template, {
            seed: config.seed + mt(),
            helpers: jsonHelpers
    }));

    // return a zipf distributed integer in range [1, N]
    const zipfGenerators = new QuickLRU({ maxSize: 200 });
    r.zipf = (N) => {
        const key = `z${N}`;
        if (!zipfGenerators.has(key)) {
            zipfGenerators.set(key, Prob.zipf(1, N));
        }

        return zipfGenerators.get(key)(mt);
    };

    return r;
};
