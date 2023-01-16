//THIS IS MOCK
//TODO: Connect rabbitMQ
export const innerQ = {
    send(message: IInnerQMessage) {},
    on(task: (message: IInnerQMessageWrap) => Promise<any>) {},
}


export interface IInnerQMessage {
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