const { GeneticAlgorithm, Duration } = require('./index');

const DEFAULT_DURATION = Duration.seconds(2);
const DEFAULT_EVENT = 'round';
const DEFAULT_DELAY = 300;
const NGENES = 100;

const dtypes = [
  'u8',
  'u16',
  'u32',
  'i8',
  'i16',
  'i32',
  'f32',
  'f64',
];

function simulate(
  checks = [],
  opts = {},
  event = DEFAULT_EVENT,
  duration = DEFAULT_DURATION,
  dtype = 'u32',
) {
  const fitness = candidate => candidate.reduce((x, y) => x + y, 0);
  const ga = new GeneticAlgorithm(fitness, NGENES, dtype, Object.assign({timeOutMS: duration}, opts));
  for (const f of checks) {
    ga.on(DEFAULT_EVENT, () => f(ga));
  }
  return [...ga.search()];
}

function simulateAll(
  checks = [],
  opts = {},
  event = DEFAULT_EVENT,
  durations = Array(dtypes.length).fill(DEFAULT_DURATION),
) {
  return dtypes.forEach((dtype, idx) => simulate(checks, opts, event, durations[idx], dtype));
}

test('search is a public method on GeneticAlgorithm', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('search'),
  ]);
});

test('rIdx INT is defined (and public) during runtime', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('rIdx'),
    ga => expect(Number.isInteger(ga.rIdx)).toBeTruthy(),
  ]);
});

test('op ("mutate" or "crossover") is defined (and public) during runtime after either occurrs', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('op'),
    ga => expect(ga.op).toMatch(/^(mutate|crossover)$/),
  ], {}, 'op');
});

test('rank INT is defined (and public) during runtime', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('rank'),
    ga => expect(Number.isInteger(ga.rank)).toBeTruthy(),
  ]);
});

test('cIdx is defined (and public) during runtime', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('cIdx'),
    ga => expect(Number.isInteger(ga.cIdx)).toBeTruthy(),
  ]);
});

test('pop TYPED ARRAY is valid and defined (and public) when starting', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('pop'),
    ga => expect(ga.pop).toHaveProperty('length'),
    ga => expect(ga.pop.length > 0).toBeTruthy(),
    ga => expect(ga.pop).not.toContain(null),
    ga => expect(ga.pop).not.toContain(undefined),
    ga => expect(ga.pop).not.toContain(Infinity),
    ga => expect(ga.pop).not.toContain(-Infinity),
    ga => expect(ga.pop).not.toContain(NaN),
  ], 'start');
});

test('start time (startTm INT) is defined and public during runtime', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('startTm'),
    ga => expect(Number.isInteger(ga.startTm)).toBeTruthy(),
  ], {}, 'start');
});

test('scores are improving with time', () => {
  simulateAll([
    ga => {
      const snaphshot1 = ga.scores;
      setTimeout(() => {
        const snaphshot2 = ga.scores;
        const sum1 = snaphshot1.reduce((x, y) => x + y, 0);
        const sum2 = snaphshot2.reduce((x, y) => x + y, 0);
        expect(sum2).toBeGreaterThan(sum1);
      }, DEFAULT_DELAY);
    },
  ]);
});

test('best candidate (0th best) is accessible and is not empty', () => {
  simulateAll([
    ga => expect(ga).toHaveProperty('bestCand'),
    ga => expect(ga.bestCand).toHaveProperty('length'),
    ga => expect(ga.bestCand.length > 0).toBeTruthy(),
    ga => expect(ga).toHaveProperty('nthBestCand'),
    ga => expect(ga.nthBestCand(0)).toStrictEqual(ga.bestCand),
  ]);
});
