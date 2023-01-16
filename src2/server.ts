import express, { Express } from "express";
import dotenv from "dotenv";
import * as packageJSON from "../package.json"

import bodyParser from "body-parser";
import { workerify } from "./libs/cluster";
import { registerBusinessCases } from "./businessCases/controller";
import { getResult, IProcessResult, startProcess } from "./businessCases/handler";

registerBusinessCases();

workerify(process.env.IS_MULTI_SERVER, () => {
    dotenv.config();

    const app: Express = express();
    const port = process.env.PORT;

    app.use(bodyParser.json());

    app.get<IGetProcessResultParams, IProcessResult>
    ('/process/{processId}/status/', async (req, res, next) => {
        try {
            const processId = req.params.processId;
            const result: IProcessResult = await getResult(processId);

            res.send(result);
        } catch(err) {
            throw err;
        }
    });

    app.post<{}, ICreateProcessBody, IStartProcessBody>
    ('/process', async (req, res, next) => {
        try {
            const {businessCaseName, businessCasePayload, apiV} = req.body;
            //TODO: add validation for req.body;

            const processId = await startProcess(businessCaseName, businessCasePayload, apiV);

            res.send({
                processId
            });
        } catch(err) {
            next(err);
        }
    });

    app.get<{}, IStatusResult>
    ('/status', async (req, res, next) => ({
        version: packageJSON.version,
        uptime: process.uptime(),
    }));

    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
});

export interface IStatusResult {
    version: string;
    uptime: string;
}

export interface IGetProcessResultParams {
    processId: string;
}

export interface ICreateProcessBody {
    processId: string;
}

export interface IStartProcessBody {
    businessCaseName: string;
    businessCasePayload: any;
    apiV: string;
}