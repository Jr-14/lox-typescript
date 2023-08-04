import { Token } from './token';

export type Expr = 
    | Binary 
    | Grouping 
    | Literal 
    | Unary

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
