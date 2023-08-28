import { Assignment, Binary, Call, Expr, ExprStatements, Function, Grouping, If, Literal, Logical, Print, Return, Statements, Unary, Variable, VariableDeclaration, While } from "./ast";
import RuntimeError from "./runtimeError";
import { Token } from "./token";
import TokenType from "./tokentype";
import Lox from ".";
import Environment from "./environment";
import { LoxCallable } from "./loxCallable";
import { LoxFunction } from "./loxFunction";
import { ReturnException } from "./return";

export default class Interpreter {

    globals: Environment = new Environment();

    private environment: Environment = this.globals;

    private locals: Map<Expr, number> = new Map();

    constructor() {
        const loxCallable: LoxCallable = {
            type: 'LoxCallable',
            callable: true,
            arity: () => 0,
            call: (interpreter, args) => {
                return Math.round(Date.now());
            },
        }
        loxCallable['toString'] = () => "<native fn>";
        this.globals.define("clock", loxCallable);
    }

    evaluateLiteralExpr(expr: Literal) {
        return expr.value;
    }

    evaluteGroupingExpr(expr: Grouping) {
        return this.evaluate(expr.expression);
    }

    evaluateUnaryExpr(expr: Unary) {
        const right: any = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.checkNumberOperand(expr.operator, right);
                return - Number(right);
            case TokenType.BANG:
                return !this.isTruthy(right);
        }

        // Unreachable
        return null;
    }

    evaluateBinaryExpr(expr: Binary): any {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.GREATER:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
            case TokenType.MINUS:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) - Number(right);
            case TokenType.PLUS:
                if (typeof left === "number" && typeof right === "number") {
                    return Number(left) + Number(right);
                }
                if (typeof left === "string" && typeof right === "string") {
                    return String(left) + String(right);
                }
                throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
            case TokenType.SLASH:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.checkNumberOperands(expr.operator, left, right);
                return Number(left) * Number(right);
        }

        // Unreachable state
    }

    evaluateCallExpr(expr: Call) {
        const callee: any = this.evaluate(expr.callee);

        const args = [];
        for (const arg of expr.arguments) {
            args.push(this.evaluate(arg));
        }

        if (!callee.hasOwnProperty('callable')) {
            throw new RuntimeError(expr.paren, "Can only call functions and classes.");
        }

        const func = callee as object & LoxCallable;
        if (args.length !== func.arity()) {
            throw new RuntimeError(expr.paren, `Expect + ${func.arity()} arguments but got ${args.length}.`);
        }
        return func.call(this, args);
    }

    evaluateLogicalExpr(expr: Logical): any {
        const left: any = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) {
                return left;
            }
        } else {
            if (!this.isTruthy(left)) {
                return left;
            }
        }

        return this.evaluate(expr.right);
    }

    evaluateExpressionStatement(statement: ExprStatements): void {
        this.evaluate(statement.expr)
    }

    evaluateFunctionStataement(statement: Function): void {
        const func = new LoxFunction(statement, this.environment);
        this.environment.define(statement.name.lexeme, func);
    }

    evaluatePrintStatement(statement: Print): void {
        const value: any = this.evaluate(statement.expression);
        console.info(this.stringify(value));
    }

    evaluateReturnStatement(statement: Return): void {
        let value = null;
        if (statement.value !== null) {
            value = this.evaluate(statement.value);
        }
        throw new ReturnException(value);
    }

    evaluateVarStatement(statement: VariableDeclaration): null {
        let value: any = null;
        if (statement.initialiser != null) {
            value = this.evaluate(statement.initialiser);
        }
        this.environment.define(statement.name.lexeme, value);
        return null;
    }

    evaluateWhileStatement(statement: While): null {
        while (this.isTruthy(this.evaluate(statement.condition))) {
            this.evaluateStatement(statement.body);
        }
        return null;
    }

    evaluateAssignExpression(expr: Assignment): any {
        const value: any = this.evaluate(expr.value);
        const distance = this.locals.get(expr);
        if (distance != null) {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }
        return value;
    }

    evaluteVarExpression(expr: Variable): any {
        return this.lookUpVariable(expr.name, expr);
    }

    private lookUpVariable(name: Token, expr: Expr) {
        const distance = this.locals.get(expr);
        if (distance != null ) {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.globals.get(name);
        }
    }

    interpret(statements: Statements[]): void {
        try {
            for (const statement of statements) {
                this.evaluateStatement(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                Lox.runtimeError(error);
            } else {
                throw error;
            }
        }
    }

    private evaluateStatement(statement: Statements) {
        switch (statement.type) {
            case 'Print':
                this.evaluatePrintStatement(statement);
                return;
            case 'Expression Statements':
                this.evaluateExpressionStatement(statement);
                return;
            case 'Variable Declaration':
                this.evaluateVarStatement(statement);
                return;
            case 'Block':
                this.evaluateBlockStatement(statement.statements, new Environment(this.environment));
                return;
            case 'If':
                this.evaluateIfStatement(statement);
                return;
            case 'While':
                this.evaluateWhileStatement(statement);
                return;
            case 'Function':
                this.evaluateFunctionStataement(statement);
                return;
            case 'Return':
                this.evaluateReturnStatement(statement);
                return;
            default:
                throw new Error(`Attempted to evaluate unhandled statement. Statement - ${statement}`);
        }
    }
    
    private evaluateIfStatement(statement: If): null {
        if (this.isTruthy(this.evaluate(statement.condition))) {
            this.evaluateStatement(statement.thenBranch)
        } else if (statement.elseBranch !== null) {
            this.evaluateStatement(statement.elseBranch);
        }
        return null;
    }

    evaluateBlockStatement(statements: Statements[], environment: Environment) {
        const previous: Environment = this.environment;
        try {
            this.environment = environment;
            for (const statement of statements) {
                this.evaluateStatement(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    evaluate(expr: Expr): any {
        switch (expr.type) {
            case "Literal":
                return this.evaluateLiteralExpr(expr);
            case "Unary":
                return this.evaluateUnaryExpr(expr);
            case "Binary":
                return this.evaluateBinaryExpr(expr);
            case "Grouping":
                return this.evaluate(expr.expression);
            case "Variable":
                return this.evaluteVarExpression(expr);
            case "Assignment":
                return this.evaluateAssignExpression(expr);
            case "Logical":
                return this.evaluateLogicalExpr(expr);
            case "Call":
                return this.evaluateCallExpr(expr); 
            default:
                throw new Error(`Attempted to evaluate unhandled expression. - ${expr}`);
        }
    }

    resolve(expr: Expr, depth: number): void {
        this.locals.set(expr, depth);
    }

    private isTruthy(object: any): boolean {
        if (object == null) {
            return false;
        }
        if (typeof object === "boolean") {
            return Boolean(object);
        }
        return true;
    }

    private isEqual(left: Expr, right: Expr): boolean {
        return left === right;
    }

    private stringify(object: any): string {
        if (object === null) {
            return "nil";
        }

        if (typeof object === "number") {
            const text = `${object}`;
            if (text.endsWith(".0")) {
                return text.split(".")[0];
            }
            return text;
        }

        return `${object}`;
    }

    private checkNumberOperand(operator: Token, operand: any): void {
        if (typeof operand === "number") {
            return;
        }

        throw new RuntimeError(operator, "Operand must be a number.");
    }

    private checkNumberOperands(operator: Token, left: any, right: any) {
        if (typeof left === "number" && typeof right === "number") {
            return;
        }

        throw new RuntimeError(operator, "Operand must be a number.");
    }
}
