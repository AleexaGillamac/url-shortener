import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildApp } from "./app.js";

describe('Fastify Application API', () => {
    let app: ReturnType<typeof buildApp>

    beforeEach( () => {
        app = buildApp()

        app.ready()
    })

    afterEach(() => {
        app.close()
    })

    test('Get /health returns a 200 status code', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        })

        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.payload)).toEqual({status: 'ok'})
    })

    
})