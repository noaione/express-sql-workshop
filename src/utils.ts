import { Response } from "express";

type Undefined = null | undefined;

/**
 * Check if our value is undefined or null
 * @param value Value to be checked
 * @returns True if value is null or undefined
 */
export function isNone(value: any): value is Undefined {
    return value === null || value === undefined;
}

/**
 * Wrap our data response in an unified response format
 * @param res Response object from express
 * @param data The data we will sent
 * @param error The error message we will sent
 * @param code The error code
 */
export function wrapJSON(res: Response<any, Record<string, any>>, data?: any, error?: string, code?: number) {
    if (isNone(data)) {
        res.json({error: error || (code === 200 ? "Success" : "Unknown Error"), code: code || 500, success: code === 200});
    } else {
        res.json({data, error: error || (code === 200 ? "Success" : "Unknown Error"), code, success: code === 200});
    }
}