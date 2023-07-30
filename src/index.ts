import process from 'node:process';
import fs from 'node:fs';

// Track if there has been any errors
let hadError: boolean = false;

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
    if (hadError) {
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
        console.log('end');
    })
}   

const run = (source: string) => {
    // const scannedTokens = scanner(source);
    // const tokens: Token[] = scanner.ScanTokens();
    // for (token in tokens) {
    // console.info(token);
    // }
}

const error = (line: number, message: string): void => {
    report(line, "", message);
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
    report
}

export default Lox;

// Run
main(process.argv);