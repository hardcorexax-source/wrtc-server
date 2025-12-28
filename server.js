const {WebSocketServer} = require('ws');

const wss = new WebSocketServer({port:8080});

const clients = {};

wss.on('connection', (ws) => {
    console.log('New client is connect!');

    ws.on('message', (message) => {
        const client = JSON.parse(message);
        
        // Сохраняем websocket соединение
        clients[client.name] = {
            ...client,
            ws: ws
        };

        console.log(`📥 Received from ${client.name} (${client.role})`);

        // Если клиент запрашивает соединение с сервером
        if (client.role === "client" && client.requestTo) {
            const target = clients[client.requestTo];
            
            // Если у сервера уже есть offer - отправляем его клиенту
            if (target && target.data) {
                console.log(`📤 Sending stored offer from ${client.requestTo} to ${client.name}`);
                ws.send(JSON.stringify({ data: target.data }));
            }
        }

        // Пересылаем данные (answer от клиента к серверу)
        if (client.data && client.requestTo && client.requestTo !== "none") {
            const target = clients[client.requestTo];
            
            if (target && target.ws) {
                console.log(`📤 Forwarding signal from ${client.name} to ${client.requestTo}`);
                target.ws.send(JSON.stringify({ data: client.data }));
            }
        }
    });

    ws.on('close', () => {
        for (let name in clients) {
            if (clients[name].ws === ws) {
                console.log(`Client ${name} disconnected`);
                delete clients[name];
            }
        }
    });
});

console.log('WebSocket server running on port 8080');
