//fixme: THIS IS MOCK!
//TODO: add real db

import exp from "constants";
import { Response } from "express";

//TODO:
export type processId = string;

export interface IDbData {
    [key: string]: any
}

export enum EProcessStatus {
    'started' = 'started',
    'finished' = 'finished',
    'error' = 'error',
}

let dbId = 0;
const collection = []; //table

export const db: IStoreDb = {
    async transaction<Result>(task: TransactionTask<Result>) {
        return await task(db);
    },
    async startTransaction() {},
    async commitTransaction() {},
    async rollbackTransaction() {},

    //just for example
    async create(data: Object): Promise<string> {
        const dataToCreate = Object.assign({
            status: EProcessStatus.started
        }, data) as IDbData;
        const id = String(dbId++);
        dataToCreate.id = id;
        collection.push(data);
        return Promise.resolve(id);
    },
    async findById(id: string): Promise<any> {
        return Promise.resolve(collection.find(item => item.id === id));
    },
    //just for example
    async update(id, data): Promise<any> {
        const index = collection.findIndex(item => item.id === id);
        data.id = id;
        collection[index] = data;
        return Promise.resolve(data);
    },
    async delete() {},

    async finishProcess(processId: string): Promise<void> {
        await db.update(processId, {status: 'finished'});
    },

    async createProcess(businessCaseName: string, businessCasePayload: any, apiV: string, payloadName: string): Promise<string> {
        const processId = await db.create({ businessCaseName, [payloadName]: businessCasePayload});

        return processId;
    },

    async setStage(processId: string, stageName: string, previousResult?: any, previousResultName?: string): Promise<any> {
        const dataToUpdate = {
            stage: stageName,
        };

        if (previousResult) {
            dataToUpdate[previousResultName || stageName] = previousResult;
        }

        const result = await db.update(processId, dataToUpdate);
        return result;
    },

    async setError(processId: string, stageName: string, error: any): Promise<void> {
        const dataToUpdate = {
            stage: stageName,
            status: EProcessStatus.error,
            error
        };

        await db.update(processId, dataToUpdate);
    },

};


//pseudo-code: this method is similar to typeorm transaction, but some different
export async function doTransaction<Result>(task: TransactionTask<Result>): Promise<Result> {
    try {
        const result = await db.transaction(async (connection: IStoreDb) => {
            try {
                await connection.startTransaction()
                const result = await task(connection);
                await connection.commitTransaction();

                return result as Result;
            } catch (err) {
                await connection.rollbackTransaction();
                throw err;
            }
        });

        return result;
    } catch(err) {
        throw err;
    }
}

export interface IStoreDb {
    create(data: Object): Promise<string>
    findById(id: string): Promise<any>
    update(id, data): Promise<any>
    delete(id: string): Promise<void>

    transaction(task: Function)
    startTransaction()
    commitTransaction()
    rollbackTransaction()

    finishProcess(processId: string): Promise<void>
    createProcess(businessCaseName: string, businessCasePayload: any, apiV: string, payloadName: string): Promise<string>
    setStage(processId: string, stageName: string, previousResult?: any, previousResultName?: string): Promise<any>
    setError(processId: string, stageName: string, error: any): Promise<void>
}

export type TransactionTask<Result> = (db: IStoreDb) => Promise<Result>