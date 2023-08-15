import Interpreter from "./interpreter";

export type LoxCallable = {
    type: 'LoxCallable';
    arity: () => number;
    call: (interpreter: Interpreter, args: any[]) => any;
}