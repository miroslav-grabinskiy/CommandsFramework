import { workerify } from "./libs/cluster";
import * as Errors  from "./errors";
import { getBusinessCase } from "./businessCases/controller";
import { processStage } from "./businessCases/handler";
import { IServiceQMessageResponseWrap, serviceQ } from "./MessageBus/serviceQ";
import { createTaskId, parseTaskId } from "./businessCases/lib";
import { checkExistingMessageByTaskId } from "./MessageBus/lib";

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

            const stage = api[nextStageIndex];
            const currentStageTaskId = createTaskId({ businessCaseName, apiV, processId, stageName: stage.name });

            const currentStageFinished = await checkExistingMessageByTaskId(currentStageTaskId);

            if (currentStageFinished) {
                message.markAsResolved();
                return;
            }

            await processStage({businessCaseName, apiV, previousResult, stageIndex: nextStageIndex, processId, taskId: currentStageTaskId});
            await message.markAsResolved();
        } catch(err) {
            await message.markAsResolved();
            //TODO: log error(err);
            throw Errors.IncorrectInnerQMessage(err, message.body);
        }
    });
});