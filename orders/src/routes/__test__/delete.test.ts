import { natsWrapper } from './../../nats-wrapper';
import { createTicket } from './../../test/create-ticket';
import request from 'supertest';
import { app } from '../../app';
import { getCookie } from '../../test/get-cookie';
import { OrderStatus } from '@geticket/common';

it('updates order to cancelled', async () => {
    const ticket = await createTicket();

    const userCookie = getCookie();

    const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', userCookie)
        .send({ ticketId: ticket.id })
        .expect(201);

    await request(app)
        .patch(`/api/orders/${orderResponse.body.id}`)
        .set('Cookie', userCookie)
        .send()
        .expect(204);

    const { body: updatedOrder } = await request(app)
        .get(`/api/orders/${orderResponse.body.id}`)
        .set('Cookie', userCookie)
        .send();

    expect(updatedOrder.status).toEqual(OrderStatus.Cancelled);
});

it('publish an cancel event when an order is cancelled', async () => {
    const ticket = await createTicket();

    const userCookie = getCookie();

    const orderResponse = await request(app)
        .post('/api/orders')
        .set('Cookie', userCookie)
        .send({ ticketId: ticket.id })
        .expect(201);

    await request(app)
        .patch(`/api/orders/${orderResponse.body.id}`)
        .set('Cookie', userCookie)
        .send()
        .expect(204);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

});