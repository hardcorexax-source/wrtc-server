// The usage -
const wrtc = require("@roamhq/wrtc");
const { Peer } = require("peerjs");
const { WebSocket } = require("ws");

const content = {value: "<h1>Hello</h1>"}
//const statusDiv = document.getElementById('status');
       


const socket = new WebSocket("wss://my-api-test-domen.pp.ua");
const peer = new Peer();
let activeConnections = [];

peer.on('open', id => {
    console.log(`🆔 Peer ID: ${id}`);
    //statusDiv.textContent = `Peer ID: ${id} - Connecting to signaling server...`;
                
    socket.addEventListener('open', () => {
        console.log('✅ WebSocket connected');
        //statusDiv.textContent = 'Connected! Waiting for clients...';
                    
        socket.send(JSON.stringify({
            role: "server", 
            name: "bot_father",
            data: id,
            requestTo: "none"
        }));
    });
});

peer.on('connection', (conn) => {
    console.log("🔗 New client connected");
    //statusDiv.textContent = `Client connected! Total: ${activeConnections.length + 1}`;
           
    conn.on('open', () => {
        activeConnections.push(conn);
        console.log('✅ Connection established with client');
               
        // Отправляем текущий контент при подключении
        if (content.value) {
            conn.send(content.value);
        }
    });
            
    conn.on('data', (data) => {
        console.log('📨 Received from client:', data);
    });
            
    conn.on('close', () => {
        activeConnections = activeConnections.filter(c => c !== conn);
        console.log('🔌 Client disconnected');
        // statusDiv.textContent = `Client disconnected. Active: ${activeConnections.length}`;
    });
});

/* Отправка контента всем подключенным клиентам
content.addEventListener('input', () => {
    const data = content.value;
    activeConnections.forEach(conn => {
        if (conn.open) {
            conn.send(data);
        }
    });
});*/

peer.on('error', err => {
    console.error('❌ Peer error:', err);
    // statusDiv.textContent = 'Error: ' + err.message;
});

socket.addEventListener('error', err => {
    console.error('❌ WebSocket error:', err);
    // statusDiv.textContent = 'WebSocket error!';
});