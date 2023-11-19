
class WebSocketService {
    constructor(url) {
        this.socket = new WebSocket(url);
    }

    connectAndSubscribe(onMessage) {
        const email = 'sharmadivyanshu1996@gmail.com'; // Replace with your email
        const serverUrl = `wss://pronto-challenge.ngrok.app/${email}/ws`;
        const newSocket = new WebSocket(serverUrl);

        newSocket.onopen = () => {
            console.log('Connected to the server');
            newSocket.send(JSON.stringify({ 'subscribe': 'msg' }));
            newSocket.send(JSON.stringify({ 'subscribe': 'loonState' }));
        };

        newSocket.onmessage = (event) => {
            onMessage(event);
        };

        newSocket.onclose = () => console.log('WebSocket closed');
        newSocket.onerror = (error) => console.error('WebSocket error:', error);
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
