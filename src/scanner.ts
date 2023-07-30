import TokenType from "./tokentype";
import { createToken, TokenLiteral, type Token } from "./token";
import Lox from ".";

class Scanner {
    private source: string;
    private tokens: Token[] = [];

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    constructor(source: string) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(createToken(TokenType['EOF'], '', null, this.line));
        return this.tokens;
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private scanToken(): void {
        const c = this.advance();
        switch(c) {
            case '(': {
                this.addToken(TokenType['LEFT_PAREN'], null);
                break;
            }
            case ')': {
                this.addToken(TokenType['RIGHT_PAREN'], null);
                break;
            }
            case '{': {
                this.addToken(TokenType['LEFT_BRACE'], null);
                break;
            }
            case '}': {
                this.addToken(TokenType['RIGHT_BRACE'], null);
                break;
            }
            case ',': {
                this.addToken(TokenType['COMMA'], null);
                break;
            }
            case '.': {
                this.addToken(TokenType['DOT'], null);
                break;
            }
            case '-': {
                this.addToken(TokenType['MINUS'], null);
                break;
            }
            case '+': {
                this.addToken(TokenType['PLUS'], null);
                break;
            }
            case ';': {
                this.addToken(TokenType['SEMICOLON'], null);
                break;
            }
            case '*': {
                this.addToken(TokenType['STAR'], null);
                break;
            }
            case '!': {
                this.addToken(this.match('=') ? TokenType['BANG_EQUAL'] : TokenType['BANG'], null);
                break;
            }
            case '=': {
                this.addToken(this.match('=') ? TokenType['EQUAL_EQUAL'] : TokenType['EQUAL'], null);
                break;
            }
            case '<': {
                this.addToken(this.match('=') ? TokenType['LESS_EQUAL'] : TokenType['LESS'], null);
                break;
            }
            case '>': {
                this.addToken(this.match('=') ? TokenType['GREATER_EQUAL'] : TokenType['GREATER'], null);
                break;
            }
            case '/': {
                if (this.match('/')) {
                    // A comment goes until the end of the line.
                    while (this.peek() != '\n' && !this.isAtEnd()) {
                        this.advance();
                    }
                } else {
                    this.addToken(TokenType['SLASH'], null);
                }
                break;
            }
            case ' ': break;
            case '\r': break;
            case '\t': break;
            case '\n': {
                this.line++;
                break;
            }

            default:
                Lox.error(this.line, "Unexpected character.");
                break;
        }
    }

    private advance(): string {
        return this.source[this.current++];
    }

    private addToken(type: TokenType, literal: TokenLiteral) {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(createToken(type, text, literal, this.line));
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) {
            return false;
        }
        if (this.source.charAt(this.current) != expected) {
            return false;
        }
        this.current++;
        return true;
    }

    private peek(): string {
        return this.isAtEnd() ? '\0' : this.source.charAt(this.current);
    }
}

export default Scanner;