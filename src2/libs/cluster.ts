import cluster from 'node:cluster';
import { cpus } from 'node:os';

export function workerify(isMulti: boolean | string, task: Function): void {
    addShutdownHandlers();

    if (!isMulti) {
        return task();
    }

    if (cluster.isPrimary) {
        console.log(`Primary ${process.pid} is running`);

        const numCPUs = cpus().length;
        console.log('number of CPUs: ', numCPUs);

        // Fork workers.
        for (let i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    } else {
        console.log(`Worker ${process.pid} is running`);
        task();
    }
}

function addShutdownHandlers() {
    process.on('SIGINT', () => {
        console.log(`process ${process.pid} died`);
        process.exit()
    });

    process.on('SIGTERM', () => {
        console.log(`process ${process.pid} died`);
        process.exit()
    });
}