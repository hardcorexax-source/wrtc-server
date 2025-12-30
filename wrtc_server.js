var Peer = require('simple-peer')

let peer;
        let socket;
        //const content = // document.querySelector("#content2user");

        function initPeer() {
            console.log('🚀 Starting peer...');
            
            const peer = new Peer({
                initiator: true,
                trickle: false
            })
            
            peer.on('signal', data => {
                console.log('📡 Generated offer:', data);
                //// document.getElementById('status').textContent = 'Offer generated, connecting to signaling server...';
                
                // Подключаемся к WebSocket ПОСЛЕ генерации offer
                socket = new WebSocket("wss://my-api-test-domen.pp.ua");
                
                socket.addEventListener("open", () => {
                    console.log('✅ WebSocket connected');
                    // document.getElementById('status').textContent = 'Sending offer...';
                    
                    socket.send(JSON.stringify({
                        role: "server",
                        name: "bot_father",
                        data: data,
                        requestTo: "none"
                    }))
                    
                    console.log('📤 Sent offer to signaling server');
                    // document.getElementById('status').textContent = 'Offer sent! Waiting for client...';
                });
                socket.addEventListener("message", event => {
                    console.log('📥 Received message:', event.data);
                    const msg = JSON.parse(event.data)
                    if (msg.data) {
                        console.log('🔄 Signaling with answer:', msg.data);
                        peer.signal(msg.data)
                        // document.getElementById('status').textContent = 'Answer received, establishing connection...';
                    }
                });
                socket.addEventListener('error', err => {
                    console.error('❌ WebSocket error:', err);
                    // document.getElementById('status').textContent = 'WebSocket error!';
                });
            })
            peer.on('connect', () => {
                console.log('✅✅✅ PEER CONNECTED!');
                // document.getElementById('status').textContent = '🎉 CONNECTED! Sending message...';
                peer.send(content.value);
            })
            peer.on('data', data => {
                console.log('📨 Received from client:', data.toString())
            })
            peer.on('close', () => {
                console.log('🔌 Connection closed, reinitializing...');
                // document.getElementById('status').textContent = 'Connection closed, waiting for new client...';
                if (socket) socket.close();
                setTimeout(initPeer, 1000);
            })
            peer.on('error', err => {
                console.error('❌ Peer error:', err)
                // document.getElementById('status').textContent = 'Peer error: ' + err.message;
                peer.destroy();
            })
        }

        initPeer();

        content.addEventListener('input', () => {
            if (peer && peer.connected) {
                peer.send(content.value)
            }
        })