import {
    ECommandName,
    IServiceMessageRequest,
    serviceQ,
} from "../MessageBus/serviceQ";
import { TaskId } from "../MessageBus/lib";

export async function checkApproved(taskId: TaskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK: string): Promise<void> {
    const message: IServiceMessageRequest<string> = {
        taskId,
        command: ECommandName.checkApproved,
        payload: DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK,
    };

    await serviceQ.send(message);
}

export async function approve(taskId: TaskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK: string): Promise<void>  {
    const message: IServiceMessageRequest<string> = {
        taskId,
        command: ECommandName.approve,
        payload: DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK,
    };

    await serviceQ.send(message);
}

export async function getBalance(taskId: TaskId, address: IServiceAddress): Promise<void>  {
    const message: IServiceMessageRequest<IServiceAddress> = {
        taskId,
        command: ECommandName.getBalance,
        payload: address,
    };

    await serviceQ.send(message);
}

export async function feed(taskId: TaskId, count: number): Promise<void>  {
    const message: IServiceMessageRequest<number> = {
        taskId,
        command: ECommandName.getBalance,
        payload: count,
    };

    await serviceQ.send(message);
}

export async function sign(taskId): Promise<void>  {
    const message: IServiceMessageRequest<void> = {
        taskId,
        command: ECommandName.getBalance,
    };

    await serviceQ.send(message);
}

export async function send(taskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK: string, address: IServiceAddress, signature: ISignature): Promise<void> {
    const message: IServiceMessageRequest<ISendPayload> = {
        taskId,
        command: ECommandName.getBalance,
        payload: {
            DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK,
            address,
            signature
        }
    };

    await serviceQ.send(message);
}

export interface ISendPayload {
    DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK: string;
    address: IServiceAddress;
    signature: ISignature;
}

export type ISignature = string;

export interface IServiceAddress {}