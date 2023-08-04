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

export interface Grouping {
    type: 'Grouping';
    expression: Expr;
};

export interface Literal {
    type: 'Literal';
    value: any;
};

export interface Unary {
    type: 'Unary';
    operator: Token;
    right: Expr;
};
