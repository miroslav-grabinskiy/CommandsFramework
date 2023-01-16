import { workerify } from "./libs/cluster";
import * as Errors  from "./errors";
import { getBusinessCase } from "./businessCases/controller";
import { processStage } from "./businessCases/handler";
import { IServiceQMessageResponseWrap, serviceQ } from "./MessageBus/serviceQ";
import { parseTaskId } from "./businessCases/lib";

workerify(process.env.IS_MULTI_SERVICE_Q_CONSUMER === 'true', () => {
    serviceQ.on(async (message: IServiceQMessageResponseWrap) => {
        try {
            const taskId = message.body.taskId;
            const { businessCaseName, apiV, stageName, processId } = parseTaskId(taskId);
            const previousResult = message.body.result;

            const businessCase = getBusinessCase(businessCaseName);

            if (!businessCase) {
                throw '???'
            }

            const api = businessCase.apis[apiV];
            if (!api) {
                throw '???'
            }

            const previousStageIndex = api.stages.findIndex(stage => stage.name === stageName);
            const nextStageIndex = previousStageIndex + 1;

            await processStage({businessCaseName, apiV, previousResult, stageIndex: nextStageIndex, processId});
            await message.markAsResolved();
        } catch(err) {
            await message.markAsResolved();
            //TODO: log error(err);
            throw Errors.IncorrectInnerQMessage(err, message.body);
        }
    });
});