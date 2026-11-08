import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { buildApp } from "./app.js";
import { url } from './../node_modules/zod/v4/mini/schemas';



describe('Fastify Application API', () => {
    let app: ReturnType<typeof buildApp>

    beforeEach( async () => {
        app = buildApp()

        await app.ready()
    })

    afterEach(async () => {
        await app.close()
    })

    async function createLink(url: string) {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {url: url}
        })
        expect(response.statusCode).toBe(201)

        return response.json()
    }
    
    test('Get /health returns a 200 status code', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        })

        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({status: 'ok'})
    })

    test('POST /links with a valid url returns 201 and a code', async () => {
        const originalUrl = 'https://github.com'
        const response = await createLink(originalUrl)

        const body = response
        
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
    
    test('GET /:code redirects to the original url', async () => {
        const originalUrl = 'https://github.com'
        
        const { code } = await createLink(originalUrl)

        const responseGet = await app.inject({
            method: 'GET',
            url: `/${code}`
        })

        expect(responseGet.statusCode).toBe(302)
        expect(responseGet.headers.location).toEqual(originalUrl)

    })

    test('GET /:code with an unknown code returns 404', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/doesnotexist'
        })

        const body = response.json()

        expect(response.statusCode).toBe(404)
        expect(body).toEqual({ error: 'Link not found'})
    })

    test('GET /links/:code/stats counts clicks', async () => {
        const originalUrl = 'https://github.com'
        const { code } = await createLink(originalUrl)

        for (let i = 1; i <= 3; i++)
            await app.inject({
                method: 'GET',
                url: `/${code}`,
            })
        
        const responseStat = await app.inject({
            method: 'GET',
            url: `/links/${code}/stats`
        })

        const bodyStat = responseStat.json()
        
        expect(responseStat.statusCode).toBe(200)
        expect(bodyStat.totalClicks).toBe(3)
        expect(bodyStat.clicks).toHaveLength(3)
    })

    test('POST /links with no url returns 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {}
        })

        expect(response.statusCode).toBe(400)
    })

    test('POST /links with a javascript: url returns 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {url: 'javascript:alert(1)'}
        })

        expect(response.statusCode).toBe(400)
    })

    test('POST /links with a ftp url returns 400', async () => {
        const response = await app.inject({
            method: 'POST',
            url: '/links',
            payload: {url: 'ftp://example.com)'}
        })

        expect(response.statusCode).toBe(400)
    })
    test('POST /links accepts an http url', async () => {
        const response = await createLink('http://example.com')


       expect(response).toHaveProperty('code')
    })

    test('POST /links accepts an https url', async () => {
        const response = await createLink('https://example.com')

        expect(response).toHaveProperty('code')
    })
})
