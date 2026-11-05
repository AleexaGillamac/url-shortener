import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildApp } from "./app.js";

describe('Fastify Application API', () => {
    let app: ReturnType<typeof buildApp>

    beforeEach( async () => {
        app = buildApp()

        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    test('Get /health returns a 200 status code', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({status: 'ok'})
    })

    test('POST /links with a valid url returns 201 and a code', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {url: 'https://github.com'}
        })

        const body = response.json()
        
        expect(response.statusCode).toBe(201)
        expect(body).toHaveProperty('code')
        expect(typeof body.code).toBe('string')
        expect(body).toHaveProperty('shortUrl')
    })

    test('POST /links with an invalid url returns 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {url: 'not-a-url'}
        })

        expect(response.statusCode).toBe(400)
    })
    
})