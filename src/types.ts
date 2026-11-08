export type Operation = '+' | '-' | '*' | '/' | '%' | '^' | null;

export interface CalculationHistory {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  isFavorite: boolean;
  label?: string;
}

export type Theme = 'light' | 'dark';
