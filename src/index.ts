import process from 'node:process';
import * as readline from 'node:readline';

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

}

const run = (source: string) => {
    // const scannedTokens = scanner(source);
    // const tokens: Token[] = scanner.ScanTokens();
}

const runPrompt = () => {
    // const readable: Readable = new Readable;
    // readable.on('data', (chunk) => {
    //     console.log(`> ${chunk.toString()}`);
    // });
    // readable.on('error', (err: Error) => {
    //     console.error(err);
    // });
    // readable.pipe(process.stdout);
    process.stdin.setEncoding('utf-8');
    process.stdout.write('> ');
    process.stdin.resume();
    process.stdin.on('data', (dataBuffer: Buffer) => {
        process.stdout.write(`> ${dataBuffer.toString()}`);
        process.stdout.write('> ');
    })
    process.stdin.on('end', () => {
        console.log('end');
    })
}   

// Run
main(process.argv);