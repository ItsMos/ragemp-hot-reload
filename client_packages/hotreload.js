const MP_POOLS = ['browsers', 'vehicles', 'objects', 'peds', 'markers', 'labels', 'checkpoints', 'blips'];
let entitiesCreated = new Set();
let eventsCreated = [];
let errorTimeout;
let error;

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

function executeCodeWithCleanup(codeString) {
  stopErrorDisplay()
  mp.console.logInfo(`[hot-reload] Destroying ${entitiesCreated.size} entities, ${eventsCreated.length} events from the previous run.`);

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
    eval(codeString);
  } catch (_error) {
    mp.console.logError("[hot-reload] Error executing evaluated code: " + _error);
    error = _error
    mp.events._originalAdd('render', drawError)
    errorTimeout = setTimeout(stopErrorDisplay, 5000)

  } finally {
    unwrapEventRegisterer()
    MP_POOLS.forEach(unwrapCreationFunction);
    mp.console.logInfo(`[hot-reload] Successfully created and tracked ${entitiesCreated.size} new entities, ${eventsCreated.length} events.`);
  }
}

const drawError = () => {
  mp.game.graphics.drawText('[hot-reload] Error: ', [0.15, 0.35], {
    font: 0,
    scale: [0.65, 0.65],
    color: [255, 0, 0, 255]
  })
  mp.game.graphics.drawText(error, [0.25, 0.40], {
    font: 0,
    scale: [0.40, 0.40],
    color: [0, 255, 0, 255]
  })
}

const stopErrorDisplay = () => {
  if (errorTimeout != null) {
    clearTimeout(errorTimeout)
    errorTimeout = null
    mp.events.remove('render', drawError)
  }
}

mp.events.add('hotreload', executeCodeWithCleanup)
mp.console.logInfo('[hot-reload] by Moose started')
