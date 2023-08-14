import RuntimeError from "./runtimeError";
import { Token } from "./token";


export default class Environment {
    values: Map<string, any> = new Map();

    enclosing: Environment | null;

    constructor(enclosing?: Environment) {
        this.enclosing = enclosing ?? null;
    }

    /**
     * Bind a global variable definition name to a value
     * 
     * @param {string} name Name of the variable.
     * @param {any} value The value of the variable.
     */
    define(name: string, value: any): void {
        this.values.set(name, value);
    }

    /**
     * Get a global variable value by name.
     * 
     * @param name 
     * @returns 
     */
    get(name: Token): any {
        if (this.values.has(name.lexeme)) {
            return this.values.get(name.lexeme);
        }

        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }

    assign(name: Token, value: any): void {
        if (this.values.has(name.lexeme)) {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing != null) {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
    }
}