import { ITaskId, TaskId } from "../MessageBus/serviceQ";

export function createTaskId({processId, businessCaseName, apiV, stageName}: ITaskId): TaskId {
    const taskIdObject = {
        processId,
        businessCaseName,
        apiV,
        stageName
    }

    const urlSearchParams = new URLSearchParams(taskIdObject);
    const taskId: TaskId = urlSearchParams.toString();

    return taskId;
}

export function parseTaskId(taskId: TaskId): ITaskId {
    const urlSearchParams = new URLSearchParams(taskId);
    const taskParams = {};

    for (const [key, value] of urlSearchParams.entries()) {
        taskParams[key] = value;
    }

    return taskParams as ITaskId;
}