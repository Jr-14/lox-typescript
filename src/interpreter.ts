import { Binary, Expr, Grouping, Literal, Unary } from "./ast";
import RuntimeError from "./runtimeError";
import { Token } from "./token";
import TokenType from "./tokentype";
import Lox from ".";

export default class Interpreter {

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

    evaluateBinaryExpr(expr: Binary) {
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
                return !this.isEqual(left, right);
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
        return null;
    }

    interpret(expression: Expr): void {
        try {
            const value = this.evaluate(expression);
            console.info(this.stringify(value));
        } catch (error) {
            if (error instanceof RuntimeError) {
                Lox.runtimeError(error);
                return;
            }
            console.log('Unhandled error', error);
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
