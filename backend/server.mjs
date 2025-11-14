import { Hocuspocus } from '@hocuspocus/server'

// Configure the server
const server = new Hocuspocus({
  port: 1234, // We'll connect to this port from the frontend
  name: 'Excalidraw-Clone-Server',
})

// Run the server
server.listen()

console.log('✅ Backend server running on ws://127.0.0.1:1234');