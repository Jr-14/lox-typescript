import Lox from ".";
import { Assignment, Binary, Block, Call, Expr, Function, Grouping, If, Literal, Logical, Print, Return, Statements, Unary, Variable, VariableDeclaration, While } from "./ast";
import Interpreter from "./interpreter";
import { Token } from "./token";

type Scope = Map<string, boolean>;

enum FunctionType {
    NONE, FUNCTION
}

export default class Resolver {
    private interpreter: Interpreter;

    private scopes: Scope[] = []; // Stack

    private currentFunction: FunctionType = FunctionType.NONE;

    constructor(interpreter: Interpreter) {
        this.interpreter = interpreter;
    }

    resolveBlockStatement(statement: Block): void {
        this.beginScope();
        this.resolveStatements(statement.statements);
        this.endScope();
    }

    resolveFunctionStatement(statement: Function): void {
        this.declare(statement.name);
        this.define(statement.name);
        this.resolveFunction(statement, FunctionType.FUNCTION);
    }

    resolveIfStatement(statement: If): void {
        this.resolveExpression(statement.condition);
        this.resolveStatement(statement.thenBranch);
        if (statement.elseBranch != null) {
            this.resolveStatement(statement.elseBranch);
        }
    }

    resolvePrintStatement(statement: Print) {
        this.resolveExpression(statement.expression);
    }

    resolveReturnStatement(statement: Return) {
        if (this.currentFunction == FunctionType.NONE) {
            Lox.tokenError(statement.keyword, "Can't return from top-level code.");
        }
        if (statement.value != null) {
            this.resolveExpression(statement.value);
        }
    }

    resolveVariableDeclaration(statement: VariableDeclaration): void {
        this.declare(statement.name);
        if (statement.initialiser != null) {
            this.resolveExpression(statement.initialiser)
        }
        this.define(statement.name);
    }

    resolveWhileStatement(statement: While) {
        this.resolveExpression(statement.condition);
        this.resolveStatement(statement.body);
    }

    resolveAssignmentExpr(expr: Assignment): void {
        this.resolveExpression(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    resolveBinaryExpr(expr: Binary) {
        this.resolveExpression(expr.left);
        this.resolveExpression(expr.right);
    }

    resolveCallExpr(expr: Call) {
        this.resolveExpression(expr.callee);
        for (const argument of expr.arguments) {
            this.resolveExpression(argument);
        }
    }

    resolveGroupingExpr(expr: Grouping) {
        this.resolveExpression(expr.expression);
    }

    resolveLiteralExpr(expr: Literal) {
        return null;
    }

    resolveLogicalExpr(expr: Logical) {
        this.resolveExpression(expr.left);
        this.resolveExpression(expr.right);
    }

    resolveUnaryExpr(expr: Unary) {
        this.resolveExpression(expr.right);
    }

    resolveVariableExpr(expr: Variable): void {
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
                this.resolveBlockStatement(statement);
                break;
            case "If":
                this.resolveIfStatement(statement);
                break;
            case "Expression Statements":
                this.resolveExpression(statement.expr);
                break;
            case "Print":
                this.resolvePrintStatement(statement);
                break;
            case "Variable Declaration":
                this.resolveVariableDeclaration(statement);
                break;
            case "While":
                this.resolveWhileStatement(statement);
                break;
            case "Function":
                this.resolveFunctionStatement(statement);
                break;
            case "Return":
                this.resolveReturnStatement(statement);
                break;
            default:
                throw new Error(`Failed to resolve statement - ${statement}`);
        }
    }

    private resolveExpression(expr: Expr) {
        switch (expr.type) {
            case "Assignment":
                this.resolveAssignmentExpr(expr);
                break;
            case "Binary":
                this.resolveBinaryExpr(expr);
                break;
            case "Call":
                this.resolveCallExpr(expr);
                break;
            case "Grouping":
                this.resolveGroupingExpr(expr);
                break;
            case "Literal":
                this.resolveLiteralExpr(expr);
                break;
            case "Unary":
                this.resolveUnaryExpr(expr);
                break;
            case "Variable":
                this.resolveVariableExpr(expr);
                break;
            case "Logical":
                this.resolveLogicalExpr(expr);
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
        const scope = this.scopes[this.scopes.length - 1];
        if (scope.has(name.lexeme)) {
            Lox.tokenError(name, "Already a variable with this name in this scope.");
        }
        scope.set(name.lexeme, false);
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

    private resolveFunction(func: Function, type: FunctionType): void {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type;
        this.beginScope();
        for (const param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolveStatements(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }
}
