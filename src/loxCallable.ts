import Interpreter from "./interpreter";

export interface LoxCallable {
    type: 'LoxCallable';
    callable: true;
    arity: () => number;
    call: (interpreter: Interpreter, args: any[]) => any;
}
