import TokenType from "./tokentype";
import { Token } from "./token";
import { Binary, Expr, ExprStatements, Grouping, Literal, Print, Statements, Unary, Variable, VariableDeclaration } from "./ast";
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
        return this.equality();
    }

    private declaration(): Statements | null {
        try {
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
        if (this.match(TokenType.PRINT)) {
            return this.printStatement();
        }

        return this.expressionStatement();
    }

    private printStatement(): Statements {
        const value: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
        return { type: 'Print', expression: value } as Print;
    }

    private varDeclaration(): Statements {
        const name: Token = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        let initialiser;
        if (this.match(TokenType.EQUAL)) {
            initialiser = this.expression();
        }

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
        return { type: "Variable Declaration", name, initialiser } as VariableDeclaration;
    }

    private expressionStatement(): Statements {
        const expr: Expr = this.expression();
        this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
        return { type: 'Expression Statements', expr} as ExprStatements;
    }

    private equality(): Expr {
        let expr: Expr = this.comparison();

        while(this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator: Token = this.previous();
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
            const operator: Token = this.previous();
            const right: Expr = this.term();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private term(): Expr {
        let expr: Expr = this.factor();

        while(this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.factor();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private factor(): Expr {
        let expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            expr = { type: 'Binary', left: expr, operator, right } as Binary;
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator: Token = this.previous();
            const right: Expr = this.unary();
            return { type: 'Unary', operator, right } as Unary;
        }

        return this.primary();
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
            return { type: 'Literal', value: this.previous().literal } as Literal;
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr: Expr = this.expression();
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return { type: 'Grouping', expression: expr } as Grouping
        }

        if (this.match(TokenType.IDENTIFIER)) {
            return { type: 'Variable', name: this.previous()} as Variable;
        }

        throw this.error(this.peek(), "Expect expression.");
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
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type == TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private error(token: Token, message: string) {
        Lox.tokenError(token, message);
        return new ParseError(message);
    }
    
    private synchronise(): void {
        this.advance();
        
        while(!this.isAtEnd()) {
            if (this.previous().type == TokenType.SEMICOLON) {
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