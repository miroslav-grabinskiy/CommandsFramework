export type BusinessCaseProcessHandler<Payload> = (processId: string, payload: Payload) => Promise<void>;

//should throw error;
export type BusinessCaseValidatePayload<Payload> = (payload: Payload) => void;

export interface IBusinessCase {
    name: string;
    apis: {
        [key: string]: IBusinessCaseApi<any>
    };
}

export interface IBusinessCaseMap {
    [key: string]: IBusinessCase;
}

export interface IBusinessCaseApi<BusinessCasePayload> {
    name: string;
    payloadName: string;
    stages: IStage<any>[];
    catch?: IStage<any>
    //TODO: add flag to not save payload to store (add payload fields options object config if it is need)
    isHiddenPayload?: boolean;
    validatePayload: BusinessCaseValidatePayload<BusinessCasePayload>;
}

export type ServiceResponseData = any;

export interface IStage<IServiceResponseData> {
    name: string;
    handler: StageFn<IServiceResponseData>;
    stageResultName?: string; //default stage name
    isNotWriteToStore?: boolean; //default true
}

export type StageFn<IServiceResponseData> = (params: IStageArguments<IServiceResponseData>) => Promise<void> | void;

export interface IStageArguments<IServiceResponseData> {
    taskId: string;
    businessCaseName: string;
    processId: string;
    apiV: string;
    result: any;
    stage: IStage<IServiceResponseData>;
    stageIndex: number;
    state: any | void;
    next: (params?: INextParams) => Promise<void>
}

export interface INextParams {
    result?: any;
    opts?: INextOpts;
}

export interface INextOpts {
    //TODO:
    runSync: boolean;
}