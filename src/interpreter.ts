import { Assignment, Binary, Expr, ExprStatements, Grouping, If, Literal, Logical, Print, Statements, Unary, Variable, VariableDeclaration, While } from "./ast";
import RuntimeError from "./runtimeError";
import { Token } from "./token";
import TokenType from "./tokentype";
import Lox from ".";
import Environment from "./environment";

export default class Interpreter {

    private environment: Environment = new Environment();

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

    evaluatePrintStatement(statement: Print): void {
        const value: any = this.evaluate(statement.expression);
        console.info(this.stringify(value));
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
        this.environment.assign(expr.name, value);
        return value;
    }

    evaluteVarExpression(expr: Variable): any {
        return this.environment.get(expr.name);
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

    private evaluateBlockStatement(statements: Statements[], environment: Environment) {
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

    private evaluate(expr: Expr): any {
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
            default:
                throw new Error('Attempted to evaluate unhandled expression.');
        }
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
