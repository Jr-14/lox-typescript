export type ReservedKeywords =
    | 'and'
    | 'class'
    | 'else'
    | 'false'
    | 'for'
    | 'fun'
    | 'if'
    | 'nil'
    | 'or'
    | 'print'
    | 'return'
    | 'super'
    | 'this'
    | 'true'
    | 'var'
    | 'while';

enum TokenType {
    // Single-character tokens
    LEFT_PAREN = 'Left Parenthesis', RIGHT_PAREN = 'Right Parenthesis',
    LEFT_BRACE = 'Left Curly Brace', RIGHT_BRACE = 'Right Curly Brace', 
    COMMA = 'Comma', DOT = 'Dot', MINUS = 'Minus', PLUS = 'Plus',
    SEMICOLON = 'Semi Colon', SLASH = 'Slash', STAR = 'Star',

    // One or two character tokens
    BANG = 'Not', BANG_EQUAL = 'Not Equal',
    EQUAL = 'Equal', EQUAL_EQUAL = 'Double Equal',
    GREATER = 'Greater than', GREATER_EQUAL = 'Greater than or Equal',
    LESS = 'Less than', LESS_EQUAL = 'Less than or Equal',

    // Literals
    IDENTIFIER = 'Identifier', STRING = 'String', NUMBER = 'Number',

    // Keywords
    AND = 'And', CLASS = 'Class', ELSE = 'Else', IF = 'If', FALSE = 'False',
    FUN = 'Function', FOR = 'For', NIL = 'Nil', OR = 'Or', PRINT = 'Print',
    RETURN = 'Return', SUPER = 'Super', THIS = 'This', TRUE = 'True',
    VAR = 'Var', WHILE = 'While',

    EOF = 'End of File'
}

export default TokenType;