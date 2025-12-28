const Peer = require('simple-peer')
const wrtc = require('@roamhq/wrtc')

const peer = new Peer({
  initiator: true,
  wrtc
})

const ws = new WebSocket("wss://my-test-api-domen.pp.ua");

peer.on('signal', data => {
    socket.addEventListener("open", (event) => {
        socket.send(JSON.stringify(
            {
                role: "server", 
                name: "bot_father",
                data: data,
                requestTo: "none"
            }
        ))
    });
})

peer.on('connect', () => {
  peer.send('hello from A')
})

peer.on('data', data => {
  console.log('A received:', data.toString())
})
