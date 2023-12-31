import TokenType from "./tokentype";
import { Token } from "./token";
import { Assignment, Binary, Block, Call, Expr, ExprStatements, Grouping, If, Function, Literal, Logical, Print, Statements, Unary, Variable, VariableDeclaration, While, Return } from "./ast";
import Lox from ".";

export default class Parser {
    private tokens: Token[] = [];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): (Statements | null)[]{
        const statements: (Statements | null)[] = [];
        while (!this.isAtEnd()) {
            statements.push(this.declaration());
        }
        return statements;
    }

    private expression(): Expr {
        return this.assignment();
    }

    private declaration(): Statements | null {
        try {
            if (this.match(TokenType.FUN)) {
                return this.func("function");
            }
            if (this.match(TokenType.VAR)) {
                return this.varDeclaration();
            }
            return this.statement();
        } catch(error) {
            if (error instanceof ParseError) {
                this.synchronise();
                return null;
            } else {
                console.error(error);
                return null;
            }
        }
    }

    private statement(): Statements {
        if (this.match(TokenType.FOR)) {
            return this.forStatement();
        }

        if (this.match(TokenType.PRINT)) {
            return this.printStatement();
        }

        if (this.match(TokenType.LEFT_BRACE)) {
            return { type: 'Block', statements: this.block() } as Block;
        }

        if (this.match(TokenType.IF)) {
            return this.ifStatement();
        }

        if (this.match(TokenType.WHILE)) {
            return this.whileStatement();
        }

        if (this.match(TokenType.RETURN)) {
            return this.returnStatement();
        }

        return this.expressionStatement();
    }

    private forStatement(): Statements {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");
        let initialiser: Statements | null;
        if (this.match(TokenType.SEMICOLON)) {
            initialiser = null;
        } else if (this.match(TokenType.VAR)) {
            initialiser = this.varDeclaration();
        } else {
            initialiser = this.expressionStatement();
        }

        let condition: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            condition = this.expression();
        }
        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        let increment: Expr | null = null;
        if (!this.check(TokenType.RIGHT_PAREN)) {
            increment = this.expression();
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body: Statements = this.statement();

        if (increment !== null) {
            const incrementStatement: ExprStatements = { type: 'Expression Statements', expr: increment } as ExprStatements;
            body = { type: 'Block',  statements: [body, incrementStatement] } as Block;
        }

        if (condition == null) {
            condition = { type: 'Literal', value: true } as Literal;
        }
        body = { type: 'While', condition, body } as While;

        if (initialiser !== null) {
            body = { type: 'Block', statements: [initialiser, body] } as Block;
        }
        return body;
    }   

    private ifStatement(): If {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
        const condition: Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition.");

        const thenBranch: Statements = this.statement();
        let elseBranch = null;
        if (this.match(TokenType.ELSE)) {
            elseBranch = this.statement();
        }

        return { type: 'If', condition, thenBranch, elseBranch } as If;
    }

    private printStatement(): Statements {
        const value: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return { type: 'Print', expression: value } as Print;
    }

    private returnStatement(): Statements {
        const keyword = this.previousToken();
        let value: Expr | null = null;
        if (!this.check(TokenType.SEMICOLON)) {
            value = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        return { type: 'Return', keyword, value } as Return;
    }

    private varDeclaration(): Statements {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        let initialiser = null;
        if (this.match(TokenType.EQUAL)) {
            initialiser = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return { type: "Variable Declaration", name, initialiser } as VariableDeclaration;
    }

    private whileStatement(): Statements {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");
        const condition: Expr = this.expression();
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");
        const body: Statements = this.statement();

        return { type: 'While', condition, body } as While;
    }

    private expressionStatement(): Statements {
        const expr: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return { type: 'Expression Statements', expr} as ExprStatements;
    }

    private func(kind: string): Function {
        const name: Token = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);
        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);
        const parameters: Token[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 parameters.");
                }
                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);
        const body: Statements[] = this.block().filter(Boolean) as Statements[]; 
        return { type: 'Function', name, params: parameters, body } as Function;
    }

    private block(): (Statements | null)[] {
        const statements: (Statements | null)[] = [];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            statements.push(this.declaration())
        }

        this.consume(TokenType.RIGHT_BRACE, `Expect '}' after block."`);
        return statements;
    }

    private assignment(): Expr {
        let expr: Expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            const equals: Token = this.previousToken();
            const value: Expr = this.assignment();

            // Use discriminating union to narrow types
            // https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions
            if (expr.type === 'Variable') {
                const name: Token = expr.name;
                return { type: 'Assignment', name, value} as Assignment;
            }

            this.error(equals, "Invalid assignment targets.");
        }

        return expr;
    }

    private or(): Expr {
        let expr: Expr = this.and();

        while (this.match(TokenType.OR)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.and();
            expr = { type: 'Logical', left: expr, operator, right } as Logical;
        }

        return expr;
    }

    private and(): Expr {
        let expr: Expr = this.equality();

        while (this.match(TokenType.AND)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.equality();
            expr = { type: 'Logical', left: expr, operator, right } as Logical;
        }

        return expr;
    }

    private equality(): Expr {
        let expr: Expr = this.comparison();

        while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.comparison();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private comparison(): Expr {
        let expr = this.term();

        while(this.match(
            TokenType.GREATER,
            TokenType.GREATER_EQUAL,
            TokenType.LESS,
            TokenType.LESS_EQUAL)
        ) {
            const operator: Token = this.previousToken();
            const right: Expr = this.term();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private term(): Expr {
        let expr: Expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.factor();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private factor(): Expr {
        let expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.unary();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previousToken();
            const right: Expr = this.unary();
            return { type: 'Unary', operator, right } as Unary;
        }

        return this.call();
    }

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];
        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (args.length >= 255) {
                    this.error(this.peek(), "Can't have more than 255 arguments.");
                }
                args.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }
        const paren: Token = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return { type: 'Call', callee, paren, arguments: args } as Call;
    }

    private call(): Expr {
        let expr: Expr = this.primary();

        while (true) {
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);     
            } else {
                break;
            }
        }

        return expr;
    }

    private primary(): Expr {
        if (this.match(TokenType.FALSE)) {
            return { type: 'Literal', value: false } as Literal;
        }
        if (this.match(TokenType.TRUE)) {
            return { type: 'Literal', value: true } as Literal;
        }
        if (this.match(TokenType.NIL)) {
            return { type: 'Literal', value: null } as Literal;
        }

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return { type: 'Literal', value: this.previousToken().literal } as Literal;
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr: Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return { type: 'Grouping', expression: expr } as Grouping
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'Variable', name: this.previousToken()} as Variable;
        }

        return this.call();
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) {
            return this.advance();
        }

        throw this.error(this.peek(), message);
    }
    
    private check(type: TokenType): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        return this.peek().type == type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.previousToken();
    }

    private isAtEnd(): boolean {
        return this.peek().type == TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previousToken(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string) {
        Lox.tokenError(token, message);
        return new ParseError(message);
    }
    
    private synchronise(): void {
        this.advance();
        
        while(!this.isAtEnd()) {
            if (this.previousToken().type == TokenType.SEMICOLON) {
                return;
            }

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }
}

export class ParseError extends Error {
    constructor(message: string) {
        super(message);
    }
}
