
declare module Modepress {
    export interface IAuthReq extends Express.Request {
        _suppressNext: boolean;
    }
}