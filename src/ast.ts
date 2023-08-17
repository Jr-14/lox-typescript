import { Token } from './token';

export type Expr = 
    | Assignment
    | Binary 
    | Call
    | Grouping 
    | Literal 
    | Unary
    | Variable
    | Logical;

export type Statements = 
    | Block
    | If
    | ExprStatements
    | Print
    | VariableDeclaration
    | While
    | Function;


export type Assignment = {
    type: 'Assignment';
    name: Token;
    value: Expr;
};

export type Block = {
    type: 'Block';
    statements: Statements[];
};

export type Call = {
    type: 'Call';
    callee: Expr;
    paren: Token;
    arguments: Expr[];
};

export type If = {
    type: 'If';
    condition: Expr;
    thenBranch: Statements;
    elseBranch: Statements | null;
};

export type Binary = {
    type: 'Binary';
    left: Expr;
    right: Expr;
    operator: Token;
};

export type Grouping = {
    type: 'Grouping';
    expression: Expr;
};

export type Literal = {
    type: 'Literal';
    value: any;
};

export type Unary = {
    type: 'Unary';
    operator: Token;
    right: Expr;
};

export type Print = {
    type: 'Print';
    expression: Expr;
};

export type ExprStatements = {
    type: 'Expression Statements';
    expr: Expr;
};

export type VariableDeclaration = {
    type: 'Variable Declaration';
    name: Token;
    initialiser?: Expr;
};

export type Variable = {
    type: 'Variable';
    name: Token;
};

export type Logical = {
    type: 'Logical';
    left: Expr;
    operator: Token;
    right: Expr;
};

export type While = {
    type: 'While';
    condition: Expr;
    body: Statements;
};

export type Function = {
    type: 'Function';
    name: Token;
    params: Token[];
    body: Statements[];
}
