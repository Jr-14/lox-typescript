import TokenType from "./tokentype"

export type TokenLiteral = Object | null;

export type Token = {
    type: TokenType;
    lexeme: string;
    literal: TokenLiteral
    line: number;   
};

export const createToken = (type: TokenType, lexeme: string, literal: TokenLiteral, line: number): Token => {
    return { type, lexeme, literal, line };
}

export const toString = (token: Token) => {
    return `${token.type} ${token.lexeme} ${token.literal}`;
}

const token = {
    createToken,
    toString
};

export default token;