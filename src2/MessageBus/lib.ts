import { serviceQ } from "./serviceQ";
import { innerQ } from "./innerQ";

const Queues = [innerQ, serviceQ];

export async function checkExistingMessageByTaskId(id: TaskId) {
    return Queues.some(queue => queue.findMessageById(id));
}

export type TaskId = string;

export interface ITaskId {
    processId: string;
    businessCaseName: string;
    apiV: string;
    stageName: string;
}