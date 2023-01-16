//THIS IS MOCK
//TODO: Connect rabbitMQ to service
export const serviceQ = {
    send<Payload>
    (message: IServiceMessageRequest<Payload>) {},


    on(task: (message: IServiceQMessageResponseWrap) => Promise<any>) {},
}

export type TaskId = string;

export interface ITaskId {
    processId: string;
    businessCaseName: string;
    apiV: string;
    stageName: string;
}

export interface IServiceMessageRequest<Payload> {
    taskId: TaskId;
    command: ECommandName;
    payload?: Payload;
}

export enum ECommandName {
    checkApproved = 'checkApproved',
    approve = 'approve',
    getBalance = 'getBalance',
    feed = 'feed',
    sign = 'sign',
    send = 'send',
}

export interface IServiceQMessageResponse {
    taskId: TaskId;
    result: any;
}

export interface IServiceQMessageResponseWrap {
    body: IServiceQMessageResponse;
    markAsResolved: Function;
}

export enum EInnerMessageType {
    //newProcess = 'newProcess',
    //nextStage = 'nextStage',
    startStage = 'startStage',
}