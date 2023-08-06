import { Token } from './token';

export type Expr = 
    | Binary 
    | Grouping 
    | Literal 
    | Unary

export type Statements = 
    | ExprStatements
    | Print

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
    left: Expr;
    right: ';';
}