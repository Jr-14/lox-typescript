import Lox from ".";
import { Assignment, Block, Expr, Function, Statements, Variable, VariableDeclaration } from "./ast";
import Interpreter from "./interpreter";
import { Token } from "./token";

type Scope = Map<string, boolean>;

export default class Resolver {
    private interpreter: Interpreter;
    private scopes: Scope[] = []; // Stack

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    evaluateBlockStatement(statement: Block): void {
        this.beginScope();
        this.resolveStatements(statement.statements);
        this.endScope();
    }

    evaluateFunctionStatement(statement: Function): void {
        this.declare(statement.name);
        this.define(statement.name);
        this.resolveFunction(statement);
    }

    evaluateVariableDeclaration(statement: VariableDeclaration): void {
        this.declare(statement.name);
        if (statement.initialiser != null) {
            this.resolveExpression(statement.initialiser)
        }
        this.define(statement.name);
    }

    evaluateAssignmentExpr(expr: Assignment): void {
        this.resolveExpression(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    evaluateVariableExpr(expr: Variable): void {
        if (this.scopes.length !== 0 && this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false) {
            Lox.tokenError(expr.name, "Can't read local variable in its own initialiser.");
        }
        this.resolveLocal(expr, expr.name);
    }

    resolveStatements(statements: Statements[]) {
        for (const statement of statements) {
            this.resolveStatement(statement);
        }
    }

    private resolveStatement(statement: Statements) {
        switch (statement.type) {
            case "Block":
                this.evaluateBlockStatement(statement);
                break;
            case "If":
                this.evaluateIfStatement(statement);
                break;
            case "Expression Statements":
                this.evaluateExprStatement(statement);
                break;
            case "Print":
                this.evaluatePrintStatement(statement);
                break;
            case "Variable Declaration":
                this.evaluateVariableDeclaration(statement);
                break;
            case "While":
                this.evaluateWhileStatement(statement);
                break;
            case "Function":
                this.evaluateFunctionStatement(statement);
                break;
            case "Return":
                this.evaluateReturnStatement(statement);
                break;
            default:
                throw new Error(`Failed to resolve statement - ${statement}`);
        }
    }

    private resolveExpression(expr: Expr) {
        switch (expr.type) {
            case "Assignment":
                this.evaluateAssignmentExpr(expr);
                break;
            case "Binary":
                this.evaluateBinaryExpr(expr);
                break;
            case "Call":
                this.evaluateCallExpr(expr);
                break;
            case "Grouping":
                this.evaluateGroupingExpr(expr);
                break;
            case "Literal":
                this.evaluateLiteralExpr(expr);
                break;
            case "Unary":
                this.evaluateUnaryExpr(expr);
                break;
            case "Variable":
                this.evaluateVariableExpr(expr);
                break;
            case "Logical":
                this.evaluateLogicalExpr(expr);
                break;
            default:
                throw new Error(`Failed to resolve expr - ${expr}`);
        }
    }

    private beginScope(): void {
        const m = new Map<string, boolean>();
        this.scopes.push(m);
    }

    private endScope(): void {
        this.scopes.pop();
    }

    private declare(name: Token): void {
        if (this.scopes.length === 0) {
            return;
        }
        this.scopes[this.scopes.length - 1].set(name.lexeme, false);
    }

    private define(name: Token): void {
        if (this.scopes.length === 0) {
            return;
        }
        this.scopes[this.scopes.length - 1].set(name.lexeme, true);
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    private resolveFunction(func: Function): void {
        this.beginScope();
        for (const param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolveStatements(func.body);
        this.endScope();
    }
}