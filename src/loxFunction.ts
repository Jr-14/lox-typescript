import { Function } from "./ast";
import Environment from "./environment";
import Interpreter from "./interpreter";
import { LoxCallable } from "./loxCallable";
import { ReturnException } from "./return";

export class LoxFunction implements LoxCallable {
    private declaration: Function;

    type = 'LoxCallable' as const;
    callable = true as const;

    constructor(declaration: Function) {
        this.declaration = declaration
    }

    call(interpreter: Interpreter, args: any[]) {
        const environment = new Environment(interpreter.globals);
        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }
        try {
            interpreter.evaluateBlockStatement(this.declaration.body, environment);
        } catch(error) {
            if (error instanceof ReturnException) {
                return error.value;
            }
        }
        return null;
    }

    arity(): number {
        return this.declaration.params.length;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}