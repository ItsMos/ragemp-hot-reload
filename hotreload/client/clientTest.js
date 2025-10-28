// add your ID here, or more than one
let executeFor = [0]

// press ctrl + s to execute all this
const localPlayer = mp.players.local

mp.gui.chat.push('this message from my code editor')
mp.vehicles.new('sultanrs', localPlayer.position, {
  color: [3, 3] // try changing the color
})

// any entity/event you create here will be removed the next file save
// so you dont have to worry about restarting constantly to remove dublicate events/entities
