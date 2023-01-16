import { getBusinessCase } from "./controller";
import * as Errors from "../errors";
import * as store from "../dbs/stateStore";
import { EInnerMessageType, innerQ } from "../MessageBus/innerQ";
import { isAllowedApiV } from "../dbs/apiVStore";
import { INextParams } from "./businessCases.types";
import { IStoreDb } from "../dbs/stateStore";
import { createTaskId } from "./lib";

const defaultHiddenPayload = '***'; //TODO: get from config

export async function startProcess(businessCaseName: string, businessCasePayload: any, apiV: string): Promise<string> {
    const businessCase = getBusinessCase(businessCaseName);

    if (!businessCase) {
        throw Errors.BusinessCaseNotFound(businessCaseName);
    }

    const api = businessCase.apis[apiV];
    if (!api) {
        throw Errors.BusinessCaseApiNotFound(businessCaseName, apiV);
    }

    if (!await isAllowedApiV(businessCaseName, apiV)) {
        throw Errors.ApiIsNotAllowed(businessCaseName, apiV);
    }

    api.validatePayload(businessCasePayload);

    const processId: string = await store.doTransaction(async (stateDb: IStoreDb) => {
        const isSavePayload = api.isHiddenPayload ? false : true;
        const payload = isSavePayload ? businessCasePayload : defaultHiddenPayload;

        const processId = await stateDb.createProcess(businessCaseName, businessCasePayload, apiV, api.payloadName) as string;

        //TODO: add case when payload should be hidden: immediately run stage 1 (resolve transaction lock)
        await innerQ.send({
            type: EInnerMessageType.startStage,
            data: {
                processId,
                stageIndex: 0,
                businessCaseName,
                businessCaseApi: apiV,
                previousResult: payload,
            }
        });

        return processId;
    });

    return processId;
}

export async function getResult(processId: string): Promise<IProcessResult> {
    const state = await store.db.findById(processId);

    if (!state) {
        throw Errors.ProcessNotFound(processId);
    }

    if (state.error) {
        return {
            status: state.status,
            error: state.error
        };
    }

    if (state.result) {
        return {
            status: state.status,
            result: state.result || null
        }
    }

    return {
        status: state.status
    };
}

export async function processStage({ businessCaseName, apiV, previousResult, stageIndex, processId }: IProcessStageParams) {
    const businessCase = getBusinessCase(businessCaseName);
    const api = businessCase.apis[apiV];

    let state: any;

    const stage = api.stages[stageIndex];

    if (stageIndex !== 0) {
        const previousStage = api.stages[stageIndex - 1];
        //default save previous result to state
        const previousResultToSave = (!previousStage.isNotWriteToStore) ? null : previousResult;
        const previousResultName = previousStage.stageResultName || previousStage.name;
        const stageName = stage ? stage.name : 'finish';

        state = await store.db.setStage(processId, stageName, previousResultToSave, previousResultName);
    }

    if (!stage) {
        await store.db.finishProcess(processId);
    }

    try {
        const taskId = createTaskId({ businessCaseName, apiV, processId, stageName: stage.name });

        await stage.handler({
            processId,
            taskId,
            businessCaseName,
            apiV,
            stage: stage,
            stageIndex,
            result: previousResult,
            state,
            next: nextStage
        });
    } catch(err) {
        await store.db.setError(processId, stage.name, err);
    }

    async function nextStage(params: INextParams) {
        //TODO: add process params.opts.runSync
        await innerQ.send({
            type: EInnerMessageType.startStage,
            data: {
                processId,
                stageIndex: stageIndex + 1,
                businessCaseName,
                businessCaseApi: apiV,
                previousResult: params.result
            }
        });
    }
}

export interface IProcessStageParams {
    businessCaseName: string;
    apiV: string;
    stageIndex: number;
    previousResult: any;
    processId: string;
}

export interface IProcessResult {
    status: string;
    error?: any;
    result?: any;
}
