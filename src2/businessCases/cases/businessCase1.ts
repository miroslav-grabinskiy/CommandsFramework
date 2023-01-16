import { IBusinessCase, IStageArguments } from "../businessCases.types";
import * as stateStore from "../../dbs/stateStore";
import * as service from "../../service";

async function checkApprove({ result: address, taskId }: IStageArguments<IAddress>) {
    const DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK = '123';

    await service.checkApproved(taskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK);
}

async function approve({ taskId, result: isApproved, next }: IStageArguments<boolean>) {
    if (isApproved) {
        return next({opts: { runSync: true} });
    }

    const DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK = '123';
    await service.approve(taskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK);
}

async function getBalance({ state, processId, taskId }: IStageArguments<void>) {
    const address = state.address as IAddress;

    await service.getBalance(taskId, address);
}

async function feed({ taskId, result: balance, next }: IStageArguments<number>) {
    if (balance >= 5) {
        return next();
    }

    await service.feed(taskId, 5 - balance);
}

async function sign({ taskId }) {
    await service.sign(taskId);
}

async function send({ taskId, result: signature, state }) {
    //can keep and get from store if it is need -> like address
    const DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK = '123';
    const address = await state.address as IAddress;

    await service.send(taskId, DONT_UNDERSTANDABLE_VARIABLE_FROM_TASK, address, signature);
}

async function done({ processId }) {
    await stateStore.db.finishProcess(processId);
}

export const businessCase1: IBusinessCase = {
    name: 'businessCase1',
    apis: {
        '1': {
            name: '1',
            payloadName: 'address',
            stages: [
                { name: 'checkApprove', handler: checkApprove, stageResultName: 'isApproved' },
                { name: 'approve', handler: approve},
                { name: 'getBalance', handler: getBalance, stageResultName: 'balance' },
                { name: 'feed', handler: feed },
                { name: 'sign', handler: sign, stageResultName: 'signature', isNotWriteToStore: true },
                { name: 'send', handler: send },
                { name: 'done', handler: done },
            ],
            validatePayload<IAddress>(payload: IAddress) {
                //throw error if payload is not valid!
            }
        }
    },
}

export interface IAddress {
    //: ??
}