//THIS IS MOCK
//TODO: Connect rabbitMQ
import { TaskId } from "./lib";

export const innerQ = {
    send(message: IInnerQMessage) {},
    on(task: (message: IInnerQMessageWrap) => Promise<any>) {},
    findMessageById(taskId): Promise<boolean> {
        //fixme: find message in Q
        return Promise.resolve(false);
    },
}


export interface IInnerQMessage {
    taskId: TaskId;
    type: EInnerMessageType.startStage;
    data: {
        processId: string;
        businessCaseName: string;
        businessCaseApi: string;
        stageIndex: number;
        previousResult: any;
    }
}

export interface IInnerQMessageWrap {
    body: IInnerQMessage;
    markAsResolved: Function;
}

export enum EInnerMessageType {
    //newProcess = 'newProcess',
    //nextStage = 'nextStage',
    startStage = 'startStage',
}