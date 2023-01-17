import { EInnerMessageType, innerQ, IInnerQMessageWrap } from "./MessageBus/innerQ";
import { workerify } from "./libs/cluster";
import * as Errors  from "./errors";
import { getBusinessCase } from "./businessCases/controller";
import { processStage } from "./businessCases/handler";
import { createTaskId } from "./businessCases/lib";
import { checkExistingMessageByTaskId } from "./MessageBus/lib";

workerify(process.env.IS_MULTI_INNER_Q_CONSUMER === 'true', () => {
    innerQ.on(async (message: IInnerQMessageWrap) => {
        try {
            if (message.body.type !== EInnerMessageType.startStage) {
                throw 'incorrect type';
            }

            const { processId, businessCaseName, businessCaseApi: apiV, stageIndex, previousResult } = message.body.data;

            const businessCase = getBusinessCase(businessCaseName);

            //TODO:
            if (!businessCase) {
                throw '???'
            }

            const api = businessCase.apis[apiV];
            //TODO:
            if (!api) {
                throw '???'
            }

            const stage = api[stageIndex];
            const currentStageTaskId = createTaskId({ businessCaseName, apiV, processId, stageName: stage.name });

            const currentStageFinished = await checkExistingMessageByTaskId(currentStageTaskId);

            if (currentStageFinished) {
                message.markAsResolved();
                return;
            }

            await processStage({businessCaseName, apiV, previousResult, stageIndex, processId, taskId: currentStageTaskId});
            await message.markAsResolved();
        } catch(err) {
            await message.markAsResolved();
            //TODO: log error(err);
            throw Errors.IncorrectInnerQMessage(err, message.body);
        }
    });
});