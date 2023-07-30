import TokenType from "./tokentype";
import token, { type Token } from "./token";

export type ScannerState = {
    source: string,
    tokens: Token[],
    start: number,
    current: number,
    line: number
};

export const getScannerState = (source: string): ScannerState => {
    return {
        source,
        tokens: [],
        start: 0,
        current: 0,
        line: 1
    };
}

export const scanTokens = (scannerState: ScannerState): Token[] => {
    while (!isAtEnd(scannerState)) {
        const nextScannerState = {
            ...scannerState,
            start: scannerState.current
        }
        scanToken(nextScannerState);
    }

    const eofToken: Token = {
       type: TokenType['EOF'],
       lexeme: '',
       literal: null,
       line: scannerState.line
    }
    const finalScannerState = {
        ...scannerState,
        tokens: [...scannerState.tokens, eofToken]
    }
    return finalScannerState.tokens;
}

export const isAtEnd = (scannerState: ScannerState) => {
    return scannerState.current >= scannerState.source.length;
}

export const scanToken = (scannerState: ScannerState) => {

}

export const advance = (scannerState: ScannerState) => {
    
}