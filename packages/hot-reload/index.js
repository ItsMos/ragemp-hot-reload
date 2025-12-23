const fs = require('fs')
const path = require('path')

const DIRECTORY = './hotreload'

const MP_POOLS = ['vehicles', 'objects', 'peds', 'markers', 'labels', 'checkpoints', 'blips', 'pickups'];
let entitiesCreated = new Set();
let eventsCreated = [];

function wrapEventRegisterer() {
  const originalAdd = mp.events.add;
  mp.events.add = function (...args) {
    eventsCreated.push([args[0], args[1]])
    return originalAdd.apply(this, args)
  }

  mp.events._originalAdd = originalAdd
}

function unwrapEventRegisterer() {
  if (mp.events._originalAdd) {
    mp.events.add = mp.events._originalAdd
    delete mp.events._originalAdd
  }
}

function wrapCreationFunction(type) {
  const originalNew = mp[type].new;

  mp[type].new = function (...args) {
    const entity = originalNew.apply(this, args);
    // remove the plural 's'
    if (entity && entity.type === type.slice(0, -1)) {
      entitiesCreated.add(entity);
    }
    return entity;
  };

  mp[type]._originalNew = originalNew;
}

function unwrapCreationFunction(type) {
  if (mp[type]._originalNew) {
    mp[type].new = mp[type]._originalNew;
    delete mp[type]._originalNew;
  }
}

async function executeCodeWithCleanup(codeString) {
  // console.log(`[hot-reload] Destroying ${entitiesCreated.size} entities, ${eventsCreated.length} events from the previous run.`);

  eventsCreated.forEach(arr => mp.events.remove(arr[0], arr[1]));
  eventsCreated = [];
  wrapEventRegisterer()

  for (const entity of entitiesCreated) {
    if (!entity) continue
    const pool = mp[entity.type + 's']
    if (pool?.exists(entity)) {
      entity.destroy();
    }
  }
  entitiesCreated.clear();
  MP_POOLS.forEach(wrapCreationFunction);

  try {
    await eval(`(async () => {${codeString}})()`);
  } catch (error) {
    console.error("[hot-reload] Error executing evaluated code: " + error);

  } finally {
    unwrapEventRegisterer()
    MP_POOLS.forEach(unwrapCreationFunction);
    // console.log(`[hot-reload] Successfully created and tracked ${entitiesCreated.size} new entities, ${eventsCreated.length} events.`);
  }
}

let lastEval
fs.watch(DIRECTORY,
  {
    recursive: true,
    encoding: 'utf8'
  },
  (event, filePath) => {
    if (event !== 'change' || !filePath.endsWith('.js')) return

    // 1 sec delay to fix sending code twice
    if (lastEval && (Date.now() - lastEval) < 1000 ) return
    lastEval = Date.now()
    console.log(`[hot-reload]: file changed >> ${filePath}`)

    let code = fs.readFileSync(path.join(DIRECTORY, filePath))
    code = code.toString()

    if (path.dirname(filePath) === 'server') {
      executeCodeWithCleanup(code)
      return

    } else if (path.dirname(filePath) !== 'client') {
      return
    }

    let players = []
    let executeForIds = code.match(/executeFor = \[(.*)\]/)
    // code.replace(/executeFor = \[.*\];?/, '')
    if (executeForIds) {
      players = executeForIds[1].split(',')
      console.log('[hot-reload] Executing client code for IDs: ' + players)
      players = players.map(id => mp.players.at(parseInt(id))).filter(p => p != null)
    }

    if (players.length) {
      players.forEach(pl => pl.call('hotreload', [code]))
    }
  }
)

console.log('[hot-reload] watching for changes :)')