import process from 'node:process';
import fs from 'node:fs';
import Scanner from './scanner';
import { type Token } from './token';
import TokenType from './tokentype';
import Parser from './parser';
import RuntimeError from './runtimeError';
import Interpreter from './interpreter';
import { Expr, Statements } from './ast';

// Track if there has been any errors
let hadError: boolean = false;
let hadRuntimeError: boolean = false;

const interpreter: Interpreter = new Interpreter();

export const match = (type: Expr) => {
    switch (type.type) {
        case 'Binary':
            return type;
    }
}
/**
 * Main entry point to our Lox TypeScript Programming Language implementation
 * 
 * @param {string[]} args Argument to pass into the program.
 */
export const main = (args: string[]): void => {
    if (args.length > 3) {
        console.info('Usage: lox-typescript [script]');
        process.exit(9);
    } else if (args.length === 3) {
        runFile(args[3]);
    } else {
        runPrompt();
    }
}

const runFile = (path: string) => {
    const fileData: Buffer = fs.readFileSync(path);
    run(fileData.toString('utf-8'));
    if (hadError || hadRuntimeError) {
        process.exit(1);
    }
}

const runPrompt = () => {
    process.stdin.setEncoding('utf-8');
    process.stdout.write('> ');
    process.stdin.resume();
    process.stdin.on('data', (dataBuffer: Buffer) => {
        run(`${dataBuffer.toString()}`);
        hadError = false;
        process.stdout.write('> ');
    })
    process.stdin.on('end', () => {
        console.info('end');
    })
}

const run = (source: string) => {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();
    const parser: Parser = new Parser(tokens);
    const statements: Statements[] = parser.parse();

    if (hadError || !statements || !statements.length) {
        return;
    }

    console.info(statements);
    interpreter.interpret(statements);
}

const error = (line: number, message: string): void => {
    report(line, "", message);
}

const tokenError = (token: Token, message: string): void => {
    if (token.type == TokenType.EOF) {
        report(token.line, " at end", message);
    } else {
        report(token.line, ` at '${token.lexeme}' `, message);
    }
}

const runtimeError = (error: RuntimeError) => {
    console.error(error.message + `\n[line ${error.token.line}]`);
    hadRuntimeError = true;
}

const report = (line: number, where: string, message: string): void => {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    hadError = true;
}

export const Lox = {
    main,
    runFile,
    runPrompt,
    run,
    error,
    tokenError,
    report,
    runtimeError
}

export default Lox;

// Run
main(process.argv);