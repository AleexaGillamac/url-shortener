import { fastify } from 'fastify';
import { error } from 'node:console';
import { randomBytes } from 'node:crypto';
import z from 'zod';

const createLinkSchema = z.object({
    url: z.url()
})
 
export function buildApp() {
    const app = fastify({ logger: true });

    const links = new Map<string, string>();

    type Click = {
        code: string;
        timestamp: string;
        referrer: string | null;
        userAgent: string | null;
    };

    const clicks: Click[] = [];

    function generateCode(): string {
        return randomBytes(4).toString('base64url').slice(0, 6);
    }

    app.get('/health', async () => {
        return { status: 'ok' };
    });

    app.post('/links', async (request, reply) => {

        const result = createLinkSchema.safeParse(request.body)

        if (!result.success) {
            return reply.status(400).send({
                error: 'Invalid URL provided',
                details: result.error.message,
            })
        }
        const code = generateCode();
        links.set(code, result.data.url);

        return reply.status(201).send({
            code,
            shortUrl: `http://localhost:3000/${code}`,
        });
    });

    app.get<{ Params: { code: string } }>('/:code', async (request, reply) => {
        const url = links.get(request.params.code);

        if (!url) {
            return reply.status(404).send({ error: 'Link not found' });
        }

        clicks.push({
            code: request.params.code,
            timestamp: new Date().toISOString(),
            referrer: request.headers.referer ?? null,
            userAgent: request.headers['user-agent'] ?? null,
        });

        return reply.redirect(url);
    });

    app.get<{ Params: { code: string } }>(
        '/links/:code/stats',
        async (request, reply) => {
            const { code } = request.params;

            if (!links.has(code)) {
                return reply.status(404).send({ error: 'Link not found' });
            }

            const linkClicks = clicks.filter((c) => c.code === code);

            return {
                code,
                url: links.get(code),
                totalClicks: linkClicks.length,
                clicks: linkClicks,
            };
        },
    );

    return app
}
