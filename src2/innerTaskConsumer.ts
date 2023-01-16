import { EInnerMessageType, IInnerQMessage, innerQ, IInnerQMessageWrap } from "./MessageBus/innerQ";
import { workerify } from "./libs/cluster";
import * as Errors  from "./errors";
import { isAllowedApiV } from "./dbs/apiVStore";
import { getBusinessCase } from "./businessCases/controller";
import { processStage } from "./businessCases/handler";

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

            await processStage({businessCaseName, apiV, previousResult, stageIndex, processId});
            await message.markAsResolved();
        } catch(err) {
            await message.markAsResolved();
            //TODO: log error(err);
            throw Errors.IncorrectInnerQMessage(err, message.body);
        }
    });
});