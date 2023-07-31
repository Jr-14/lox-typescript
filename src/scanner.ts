import TokenType, { ReservedKeywords } from "./tokentype";
import { createToken, TokenLiteral, type Token } from "./token";
import Lox from ".";

class Scanner {
    private source: string;
    private tokens: Token[] = [];

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    private keywords: Record<ReservedKeywords, TokenType> = {
        'and': TokenType['AND'],
        'class': TokenType['CLASS'],
        'else': TokenType['ELSE'],
        'false': TokenType['FALSE'],
        'for': TokenType['FOR'],
        'fun': TokenType['FUN'],
        'if': TokenType['IF'],
        'nil': TokenType['NIL'],
        'or': TokenType['OR'],
        'print': TokenType['PRINT'],
        'return': TokenType['RETURN'],
        'super': TokenType['SUPER'],
        'this': TokenType['THIS'],
        'true': TokenType['TRUE'],
        'var': TokenType['VAR'],
        'while': TokenType['WHILE'],
    };

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
            case '"': {
                this.string();
                break;
            }

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    Lox.error(this.line, "Unexpected character.");
                }
                break;
        }
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        let type: TokenType = this.keywords[text as ReservedKeywords];
        if (!type) {
            type = TokenType['IDENTIFIER'];
        }
        this.addToken(type, null);
    }

    private advance(): string {
        // Post increment
        // Uses this.current and then increments this.current
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

    /**
     * Lookahead one character but doesn't increase the character count.
     * @returns 
     */
    private peek(): string {
        return this.isAtEnd() ? '\0' : this.source.charAt(this.current);
    }

    /**
     * Lookahead two character but doesn't increase the character count.
     * @returns 
     */
    private peekNext(): string {
        return this.current + 1 >= this.source.length
            ? '\0'
            : this.source.charAt(this.current + 1);
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private string(): void {
        while(this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == '\n') {
                this.line++;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            Lox.error(this.line, "Unterminated string.");
            return;
        }

        // The closing ".
        this.advance();

        // Trim the surrounding quotes.
        const value: string = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType['STRING'], value);
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private number(): void {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        // Look for a fractional part.
        if (this.peek() == '.' && this.isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        this.addToken(TokenType['NUMBER'], parseFloat(this.source.substring(this.start, this.current)));
    }

}

export default Scanner;