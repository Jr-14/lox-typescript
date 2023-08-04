import { Expr, Grouping, Literal } from "./ast";

export default class Interpreter {

    literalExpr(expr: Literal) {
        return expr.value;
    }

    groupingExpr(expr: Grouping) {
        return this.evaluate(expr.expression);
    }

    private evaluate(expr: Expr) {
        return expr.accept(this);
    }
}