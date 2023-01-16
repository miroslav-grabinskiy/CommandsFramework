import { businessCase1 } from "./cases/businessCase1";
import { IBusinessCase, IBusinessCaseMap } from "./businessCases.types";

const businessCases: IBusinessCaseMap = {};

registerBusinessCases();

export function registerBusinessCases(): void {
    const casesToRegister: IBusinessCase[] = [ businessCase1 ];

    casesToRegister.forEach((businessCase: IBusinessCase) => {
        registerBusinessCase(businessCase.name, businessCase);
    });
}

export function registerBusinessCase(businessCaseName: string, businessCase: IBusinessCase) {
    if (businessCases[businessCaseName]) {
        throw `Business Case ${businessCaseName} already exists`;
    }

    businessCases[businessCaseName] = businessCase;
}

export function getBusinessCase(businessCaseName: string): IBusinessCase {
    return businessCases[businessCaseName];
}

export function getStages(businessCase: IBusinessCase, api: string) {
    return businessCase.apis[api];
}
