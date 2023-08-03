import process from 'node:process';
import fs from 'node:fs';

const generateAst = (args: string[]) => {
    if (args.length != 3) {
        console.error('Usage: generate_ast <output directory>')
        process.exit(9);
    }
    const outputDir = args[3];
    defineAst(outputDir, "Expr", [
        "Binary   : Expr left, Token operator, Expr right",
        "Grouping : Expr expression",
        "Literal  : Object value",
        "Unary    : Token operator, Expr right"
    ]);
}

const defineAst = (
    outputDir: string,
    baseName: string,
    types: string[]
) => {
    const path = outputDir + "/" + baseName + ".ts";
    const content = "lox-typescript\n";
    fs.writeFileSync(path, content);
    for (const type of types) {
        const className = type.split(':')[0].trim();
        const fields = type.split(':')[1].trim();
        defineType(baseName, className, fields);
    }
}