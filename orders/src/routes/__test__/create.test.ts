import { createTicket } from './../../test/create-ticket';
import { natsWrapper } from './../../nats-wrapper';
import request from 'supertest';
import { app } from '../../app';
import { Order, OrderStatus } from '../../models/order';
import { Ticket } from '../../models/ticket';
import { getCookie } from '../../test/get-cookie';

it('returns 404 if the ticket doesnt exist', async () => {
    const ticketId = '12fsdf12';
    await request(app)
        .post('/api/orders')
        .set('Cookie', getCookie())
        .send({ ticketId })
        .expect(404);
});

it('returns an error if the ticket is locked', async () => {
    const ticket = await createTicket();
    await ticket.save();

    const order = new Order({
        ticket,
        userId: 'wsafdas',
        status: OrderStatus.Created,
        expiresAt: new Date()
    });
    await order.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', getCookie())
        .send({ ticketId: ticket.id })
        .expect(400);
});

it('reserves a ticket', async () => {
    const ticket = await createTicket();
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', getCookie())
        .send({ ticketId: ticket.id })
        .expect(201);
});

it('emits an event when an order is created', async () => {
    const ticket = await createTicket();
    await ticket.save();

    await request(app)
        .post('/api/orders')
        .set('Cookie', getCookie())
        .send({ ticketId: ticket.id })
        .expect(201);

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});


