export class NostrWebSocket {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.subscriptions = new Map();
        this.messageQueue = [];
        this.isConnected = false;
        this.connectPromise = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 1000;
    }

    connect() {
        if (this.connectPromise) return this.connectPromise;

        this.connectPromise = new Promise((resolve, reject) => {
            try {
                console.log(`Connecting to ${this.url}...`);
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    console.log(`Connected to ${this.url}`);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.processQueue();
                    resolve();
                };

                this.ws.onclose = () => {
                    console.log(`Disconnected from ${this.url}`);
                    this.isConnected = false;
                    this.connectPromise = null;
                    
                    // Try to reconnect if we haven't exceeded max attempts
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        console.log(`Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                        setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error(`WebSocket error on ${this.url}:`, error);
                    if (!this.isConnected) {
                        reject(error);
                    }
                };

                this.ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        const subId = message[1];
                        const callback = this.subscriptions.get(subId);
                        if (callback) {
                            callback(message);
                        }
                    } catch (error) {
                        console.error('Error processing message:', error);
                    }
                };
            } catch (error) {
                console.error(`Failed to connect to ${this.url}:`, error);
                this.connectPromise = null;
                reject(error);
            }
        });

        return this.connectPromise;
    }

    async send(message) {
        if (!this.isConnected) {
            this.messageQueue.push(message);
            await this.connect();
            return;
        }
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    async subscribe(filters, callback, subId = Math.random().toString(36).substring(2, 15)) {
        this.subscriptions.set(subId, callback);
        await this.send(["REQ", subId, ...filters]);
        
        // Return an unsubscribe function
        return () => {
            this.unsubscribe(subId);
        };
    }

    unsubscribe(subId) {
        if (this.subscriptions.has(subId)) {
            this.send(["CLOSE", subId]);
            this.subscriptions.delete(subId);
        }
    }

    async processQueue() {
        while (this.messageQueue.length > 0 && this.isConnected) {
            const message = this.messageQueue.shift();
            await this.send(message);
        }
    }

    close() {
        if (this.ws) {
            this.subscriptions.clear();
            this.messageQueue = [];
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
            this.connectPromise = null;
        }
    }
}
