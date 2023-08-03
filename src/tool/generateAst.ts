import process from 'node:process';
import fs from 'node:fs';

const generateAst = (args: string[]) => {
    if (args.length != 3) {
        console.error('Usage: generate_ast <output directory>')
        process.exit(9);
    }
    const outputDir = args[2];
    console.debug('Output Dir', args);
    defineAst(outputDir, "Expr", [
        "Binary   | left: Expr, operator: Token, right: Expr",
        "Grouping | expression: Expr ",
        "Literal  | value: any",
        "Unary    | operator: Token, right: Expr"
    ]);
}

const defineAst = (
    outputDir: string,
    baseName: string,
    types: string[]
): void => {
    const path = outputDir + "/" + baseName + ".ts";
    console.debug(path);
    const content = "import { Expr } from '.'\nimport { Token } from './token';\n\n";
    fs.writeFileSync(path, content, { flag: 'a'});
    for (const type of types) {
        const className = type.split('|')[0].trim();
        const fields = type.split('|')[1].trim();
        defineType(path, baseName, className, fields);
    }
}

const defineType = (
    path: string,
    baseName: string,
    className: string,
    fields: string
): void => {
    let content;
    const properties = fields.split(',').map((props) => {
        return props.split(':')[0].trim();
    });
    const propString = properties.join(", ");
    content = `export const create${className}${baseName} = (${fields}) => {\n`;
    content += `    return { ${propString} } as ${baseName};\n`
    content += `}\n\n`;
    console.debug(content);
    fs.writeFileSync(path, content, { flag: 'a' });
}

generateAst(process.argv);