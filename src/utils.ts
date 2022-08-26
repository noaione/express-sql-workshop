import { Response } from "express";

type Undefined = null | undefined;

export function isNone(value: any): value is Undefined {
    return value === null || value === undefined;
}

export function wrapJSON(res: Response<any, Record<string, any>>, data?: any, error?: string, code?: number) {
    if (isNone(data)) {
        res.json({error: error || "Unknown error", code: code || 500, success: code === 200});
    } else {
        res.json({data, error, code, success: code === 200});
    }
}