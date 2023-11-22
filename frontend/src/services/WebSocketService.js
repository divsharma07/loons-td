
class WebSocketService {
    constructor(url) {
        this.socket = new WebSocket(url);
    }

    connectAndSubscribe(onMessage) {
        this.socket.onopen = () => {
            console.log('Connected to the server');
            this.socket.send(JSON.stringify({ 'subscribe': 'msg' }));
            this.socket.send(JSON.stringify({ 'subscribe': 'loonState' }));
        };

        this.socket.onmessage = (event) => {
            onMessage(event);
        };

        this.socket.onclose = () => console.log('WebSocket closed');
        this.socket.onerror = (error) => console.error('WebSocket error:', error);
    }

    connected() {
        return this.socket.connected;
    }

    sendMessage(message) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

export default WebSocketService;
