# RAGE:MP Hot-Reload

A development tool for RAGE:MP that enables real-time code reloading without server restarts. Automatically tracks and cleans up entities and events, allowing rapid iteration during development.

## Features

- **Instant Code Execution**: Save your file and see changes immediately in-game
- **Automatic Cleanup**: Removes previously created entities and events before re-execution
- **Server & Client Support**: Hot-reload both server-side and client-side scripts
- **Selective Client Execution**: Target specific players using `executeFor` array
- **Error Display**: Client-side errors shown in-game with automatic timeout
- **Entity Tracking**: Automatically tracks vehicles, objects, peds, markers, labels, checkpoints, blips, colshapes, pickups, dummies, and browsers

## Integration

### 1. File Structure

Place the hot-reload files in your RAGE:MP server directory:

```
server-root/
├── packages/
│   └── hot-reload/
│       └── index.js          # Server-side hot-reload system
├── client_packages/
│   └── hotreload.js          # Client-side hot-reload system
└── hotreload/
    ├── server/
    │   └── serverTest.js     # Your server test scripts
    └── client/
        └── clientTest.js     # Your client test scripts
```

### 2. Client Setup

Load the hot-reload package in your `index.js` in `client_packages`:

```js
require('./hotreload.js');
```

The system will automatically start watching the `./hotreload` directory for changes.

## How to Use

### Server-Side Hot-Reload

1. Create or edit JavaScript files in `hotreload/server/`
2. Write your code (entities, events, logic)
3. Press `Ctrl + S` to save
4. Code executes immediately on the server

**Example** (`hotreload/server/serverTest.js`):

```js
const player = mp.players.at(0);

console.log(mp.config.name);

mp.events.add('testEvent', (player) => {
  player.outputChatBox('Hello from hot-reload!');
});

// Entities and events are automatically cleaned up on next save
```

### Client-Side Hot-Reload

1. Create or edit JavaScript files in `hotreload/client/`
2. Specify target player IDs in the `executeFor` array
3. Write your code
4. Press `Ctrl + S` to save
5. Code executes on specified clients

**Example** (`hotreload/client/clientTest.js`):

```js
// Target specific player IDs (comma-separated)
let executeFor = [0, 1, 2];

const localPlayer = mp.players.local;

mp.gui.chat.push('Code reloaded!');

mp.vehicles.new('sultanrs', localPlayer.position, {
  color: [3, 3]
});

// All created entities are tracked and cleaned up automatically
```

## Tracked Entities

### Server-Side
- Vehicles, Objects, Peds, Markers, Labels
- Checkpoints, Blips, Pickups

### Client-Side
- Browsers, Vehicles, Objects, Peds, Markers
- Labels, Checkpoints, Blips

### ☑️ To Do
*Contributions are welcome.*
- Track command handlers and data handlers
- Track colshapes

## Error Handling

Client-side errors are displayed in-game for 5 seconds in red text. Check the console (F8) for detailed error messages.

Server-side errors are logged to the server console.

## Notes

- Only `.js` files trigger hot-reload
- File changes are debounced (1 second) to prevent duplicate executions
- Perfect for testing, prototyping, and rapid development
- Not recommended for production environments

## Author

Created by Moose
