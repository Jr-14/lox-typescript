import TokenType from "./tokentype"

export type Token = {
    type: TokenType;
    lexeme: string;
    literal: Object | null;
    line: number;   
};

export const createToken = (type: TokenType, lexeme: string, literal: Object, line: number): Token => {
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