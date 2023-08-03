import { Expr } from '.'
import { Token } from './token';

export const createBinaryExpr = (left: Expr, operator: Token, right: Expr) => {
    return { left, operator, right } as Expr;
}

export const createGroupingExpr = (expression: Expr) => {
    return { expression } as Expr;
}

export const createLiteralExpr = (value: any) => {
    return { value } as Expr;
}

export const createUnaryExpr = (operator: Token, right: Expr) => {
    return { operator, right } as Expr;
}

