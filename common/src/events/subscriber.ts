import { Message, Stan } from "node-nats-streaming";
import { Event } from './event';


export abstract class Subscriber<T extends Event> {
    abstract subject: T['subject'];
    abstract queueGroupName: string;
    abstract onMessage(data: T['data'], msg: Message): void;

    protected client: Stan;
    protected ackWait = 5 * 1000; //5Sec 

    constructor(client: Stan) {
        this.client = client;
    }

    subscriptionOptions() {
        return this.client.subscriptionOptions()
            .setDeliverAllAvailable()
            .setManualAckMode(true)
            .setDurableName(this.queueGroupName)
            .setAckWait(this.ackWait)
    }

    subscribe() {
        const subscription = this.client.subscribe(this.subject, this.queueGroupName, this.subscriptionOptions());
        subscription.on('message', (msg: Message) => {
            console.log(`Message Received: ${this.subject}/${this.queueGroupName}`);

            const parsedMessage = this.parseMessage(msg);
            this.onMessage(parsedMessage, msg);
        });
    }

    parseMessage(msg: Message) {
        const data = msg.getData();
        return typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString('utf8'));
    }
}