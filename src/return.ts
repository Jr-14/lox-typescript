
export class ReturnException extends Error {
    value;

    constructor(value: any, message?: string) {
        super(message);
        this.value = value;
    }
}