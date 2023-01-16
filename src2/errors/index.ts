//TODO: create lib for errors, and use like:
//throw Errors.BusinessCaseNotFoundError(businessCaseName);

export interface IHttpError {
    code: number;
    type: string;
    message: string;
    options?: Object
}

export function BusinessCaseNotFound(businessCaseName: string): IHttpError {
    return {
        code: 404,
        type: 'businessCaseNotFoundError',
        message: `businessCase not found: ${businessCaseName}`,
        options: {
            businessCaseName
        },
    }
}

export function BusinessCaseApiNotFound(businessCaseName: string, apiName: string): IHttpError {
    return {
        code: 404,
        type: 'businessCaseApiNotFoundError',
        message: `businessCase api not found: ${businessCaseName}: ${apiName}`,
        options: {
            businessCaseName,
            api: apiName
        }
    }
}

export function StageNotFound(businessCaseName: string, apiName: string, stageName: string): IHttpError {
    return {
        code: 500,
        type: 'stageNotFoundError',
        message: `stage not found: ${businessCaseName}: ${apiName}: ${stageName}`,
        options: {
            businessCaseName,
            api: apiName,
            stage: stageName
        }
    }
}

export function ProcessNotFound(processId: string): IHttpError {
    return {
        code: 404,
        type: 'processNotFoundError',
        message: `process not found, id: ${processId}`,
        options: {
            processId
        }
    }
}

export function IncorrectInnerQMessage(message: string, messageBody: any): IHttpError {
    return {
        code: 404,
        type: 'incorrectInnerQMessageError',
        message,
        options: {
            message: messageBody
        }
    }
}

export function ApiIsNotAllowed(businessCaseName: string, apiName: string): IHttpError {
    return {
        code: 403,
        type: 'apiIsNotAllowedError',
        message: `businessCase api not allowed: ${businessCaseName}: ${apiName}`,
        options: {
            apiName,
            businessCaseName
        }
    }
}