import process from 'node:process';

const generateAst = (args: string[]) => {
    if (args.length != 3) {
        console.error('Usage: generate_ast <output directory>')
        process.exit(9);
    }
    const outputDir = args[3];
}