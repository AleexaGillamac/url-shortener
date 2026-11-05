import { buildApp } from './app.js';

const app = buildApp()

app.listen({ port: 3000 }, (err) => {
    if (err) {
        app.log.error(err)
        process.exit(1)
    }
})