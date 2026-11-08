/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calculator, 
  History as HistoryIcon, 
  Star, 
  Trash2, 
  Download, 
  Moon, 
  Sun, 
  X,
  RotateCcw,
  AlertCircle,
  FlaskConical,
  Delete,
  Check,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculationHistory, Theme } from './types';

// Unique ID generator
const generateId = () => Math.random().toString(36).substring(2, 11);

// Clean formatting for number displays
const formatDisplay = (valStr: string) => {
  if (valStr === 'Error' || valStr === 'Cannot divide by zero' || valStr === 'Invalid Expression') {
    return valStr;
  }
  // If it contains operators or parentheses, return as-is for expression readability
  if (/[+\-×÷^()%]/.test(valStr)) {
    return valStr;
  }
  const num = Number(valStr);
  if (isNaN(num)) return valStr;
  if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return num.toExponential(4);
  }
  // Don't format if user is currently typing a trailing decimal
  if (valStr.endsWith('.')) {
    return Number(valStr.slice(0, -1)).toLocaleString() + '.';
  }
  const parts = valStr.split('.');
  const integerFormatted = Number(parts[0]).toLocaleString();
  return parts.length > 1 ? `${integerFormatted}.${parts[1]}` : integerFormatted;
};

export default function App() {
  // State
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [isScientific, setIsScientific] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'history' | 'favorites'>('history');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCalculated, setLastCalculated] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  // Local storage persistence
  useEffect(() => {
    try {
      const savedHist = localStorage.getItem('polycalc_history_v2');
      const savedTheme = localStorage.getItem('polycalc_theme_v2') as Theme;
      const savedSci = localStorage.getItem('polycalc_scientific_v2');
      if (savedHist) setHistory(JSON.parse(savedHist));
      if (savedTheme) setTheme(savedTheme);
      if (savedSci) setIsScientific(JSON.parse(savedSci));
    } catch (e) {
      console.error('Error loading stored settings', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('polycalc_history_v2', JSON.stringify(history));
      localStorage.setItem('polycalc_theme_v2', theme);
      localStorage.setItem('polycalc_scientific_v2', JSON.stringify(isScientific));
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [history, theme, isScientific]);

  // Expression Evaluator
  const evaluateMath = useCallback((raw: string): { success: boolean; result?: string; error?: string } => {
    try {
      // Token replacements for evaluation
      let sanitized = raw
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\^/g, '**')
        .replace(/π/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(');

      // Percentage conversion: number% -> (number/100)
      sanitized = sanitized.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

      // Check for security / safe characters only
      const safeCheck = sanitized.replace(/Math\.(PI|E|sqrt|log10|log)/g, '').trim();
      if (!/^[\d.+\-*/%()\s]*$/.test(safeCheck)) {
        return { success: false, error: 'Invalid Expression' };
      }

      // Auto-close open parentheses if unbalanced
      const openParens = (sanitized.match(/\(/g) || []).length;
      const closeParens = (sanitized.match(/\)/g) || []).length;
      if (openParens > closeParens) {
        sanitized += ')'.repeat(openParens - closeParens);
      }

      // Safe evaluation
      // eslint-disable-next-line no-new-func
      const evalFn = new Function('Math', `"use strict"; return (${sanitized});`);
      const val = evalFn(Math);

      if (typeof val !== 'number' || isNaN(val)) {
        return { success: false, error: 'Invalid Expression' };
      }
      if (!isFinite(val)) {
        return { success: false, error: 'Cannot divide by zero' };
      }

      // Precision sanitization
      let resStr = '';
      if (Math.abs(val) > 1e12 || (Math.abs(val) < 1e-6 && val !== 0)) {
        resStr = Number(val.toPrecision(10)).toExponential();
      } else {
        resStr = String(parseFloat(val.toFixed(10)));
      }

      return { success: true, result: resStr };
    } catch {
      return { success: false, error: 'Invalid Expression' };
    }
  }, []);

  // Handlers
  const handleNumber = useCallback((num: string) => {
    setErrorMessage(null);
    if (lastCalculated) {
      setDisplay(num);
      setExpression('');
      setLastCalculated(false);
      return;
    }
    setDisplay(prev => (prev === '0' || prev === 'Error' ? num : prev + num));
  }, [lastCalculated]);

  const handleDecimal = useCallback(() => {
    setErrorMessage(null);
    if (lastCalculated) {
      setDisplay('0.');
      setExpression('');
      setLastCalculated(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  }, [display, lastCalculated]);

  const handleOperator = useCallback((op: string) => {
    setErrorMessage(null);
    if (display === 'Error') return;

    if (lastCalculated) {
      setExpression(`${display} ${op} `);
      setDisplay('0');
      setLastCalculated(false);
      return;
    }

    setExpression(prev => `${prev}${display} ${op} `);
    setDisplay('0');
  }, [display, lastCalculated]);

  const handleClear = useCallback(() => {
    setErrorMessage(null);
    if (display !== '0') {
      setDisplay('0');
    } else {
      setExpression('');
    }
    setLastCalculated(false);
  }, [display]);

  const handleToggleSign = useCallback(() => {
    setErrorMessage(null);
    if (display === '0' || display === 'Error') return;
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  }, [display]);

  const handlePercent = useCallback(() => {
    setErrorMessage(null);
    if (display === '0' || display === 'Error') return;
    const val = parseFloat(display) / 100;
    setDisplay(String(val));
  }, [display]);

  // Scientific Specific Handlers
  const handleSqrt = useCallback(() => {
    setErrorMessage(null);
    if (display !== '0' && !lastCalculated) {
      // Calculate immediate square root of current operand
      const num = parseFloat(display);
      if (num < 0) {
        setErrorMessage('Invalid Expression');
        return;
      }
      const res = Math.sqrt(num);
      setDisplay(String(parseFloat(res.toFixed(10))));
    } else {
      setExpression(prev => `${prev}√(`);
    }
  }, [display, lastCalculated]);

  const handleSquare = useCallback(() => {
    setErrorMessage(null);
    const num = parseFloat(display);
    if (isNaN(num)) return;
    const res = num * num;
    setDisplay(String(parseFloat(res.toFixed(10))));
  }, [display]);

  const handlePower = useCallback(() => {
    handleOperator('^');
  }, [handleOperator]);

  const handleLog = useCallback(() => {
    setErrorMessage(null);
    if (display !== '0' && !lastCalculated) {
      const num = parseFloat(display);
      if (num <= 0) {
        setErrorMessage('Invalid Expression');
        return;
      }
      const res = Math.log10(num);
      setDisplay(String(parseFloat(res.toFixed(10))));
    } else {
      setExpression(prev => `${prev}log(`);
    }
  }, [display, lastCalculated]);

  const handleLn = useCallback(() => {
    setErrorMessage(null);
    if (display !== '0' && !lastCalculated) {
      const num = parseFloat(display);
      if (num <= 0) {
        setErrorMessage('Invalid Expression');
        return;
      }
      const res = Math.log(num);
      setDisplay(String(parseFloat(res.toFixed(10))));
    } else {
      setExpression(prev => `${prev}ln(`);
    }
  }, [display, lastCalculated]);

  const handleConstant = useCallback((constSymbol: 'π' | 'e') => {
    setErrorMessage(null);
    const val = constSymbol === 'π' ? String(Math.PI) : String(Math.E);
    if (lastCalculated || display === '0') {
      setDisplay(val);
      setLastCalculated(false);
    } else {
      setDisplay(val);
    }
  }, [display, lastCalculated]);

  const handleInverse = useCallback(() => {
    setErrorMessage(null);
    const num = parseFloat(display);
    if (num === 0) {
      setErrorMessage('Cannot divide by zero');
      return;
    }
    const res = 1 / num;
    setDisplay(String(parseFloat(res.toFixed(10))));
  }, [display]);

  const handleOpenParen = useCallback(() => {
    setErrorMessage(null);
    setExpression(prev => `${prev}(`);
  }, []);

  const handleCloseParen = useCallback(() => {
    setErrorMessage(null);
    setExpression(prev => `${prev}${display !== '0' ? display : ''})`);
    setDisplay('0');
  }, [display]);

  const handleEquals = useCallback(() => {
    const fullExpr = expression.endsWith('(') || expression.endsWith(' ')
      ? `${expression}${display}`
      : expression === ''
        ? display
        : `${expression} ${display}`;

    const { success, result, error } = evaluateMath(fullExpr);

    if (success && result !== undefined) {
      const newCalc: CalculationHistory = {
        id: generateId(),
        expression: fullExpr,
        result: result,
        timestamp: Date.now(),
        isFavorite: false,
      };
      setHistory(prev => [newCalc, ...prev.slice(0, 99)]);
      setDisplay(result);
      setExpression(fullExpr);
      setLastCalculated(true);
      setErrorMessage(null);
    } else {
      setErrorMessage(error || 'Invalid Expression');
    }
  }, [expression, display, evaluateMath]);

  const handleBackspace = useCallback(() => {
    setErrorMessage(null);
    if (lastCalculated) {
      setDisplay('0');
      setLastCalculated(false);
      return;
    }
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  }, [display, lastCalculated]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is editing a favorite label input
      if (editingLabelId) return;

      if (/^[0-9]$/.test(e.key)) {
        handleNumber(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+') {
        handleOperator('+');
      } else if (e.key === '-') {
        handleOperator('−');
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '^') {
        handlePower();
      } else if (e.key === '%') {
        handlePercent();
      } else if (e.key === '(') {
        handleOpenParen();
      } else if (e.key === ')') {
        handleCloseParen();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    editingLabelId,
    handleNumber,
    handleDecimal,
    handleOperator,
    handlePower,
    handlePercent,
    handleOpenParen,
    handleCloseParen,
    handleEquals,
    handleBackspace,
    handleClear
  ]);

  // History & Favorites actions
  const toggleFavorite = (id: string) => {
    setHistory(prev =>
      prev.map(item => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const deleteItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (window.confirm('Clear all calculation history?')) {
      setHistory([]);
    }
  };

  const saveLabel = (id: string) => {
    setHistory(prev =>
      prev.map(item => (item.id === id ? { ...item, label: tempLabel.trim() || undefined } : item))
    );
    setEditingLabelId(null);
    setTempLabel('');
  };

  const reuseResult = (resultVal: string) => {
    setDisplay(resultVal);
    setExpression('');
    setLastCalculated(true);
    setErrorMessage(null);
    setIsMobileDrawerOpen(false);
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    const header = 'Date,Time,Label,Expression,Result,Favorite\n';
    const rows = history
      .map(item => {
        const d = new Date(item.timestamp);
        const dateStr = d.toLocaleDateString();
        const timeStr = d.toLocaleTimeString();
        const labelStr = item.label ? `"${item.label.replace(/"/g, '""')}"` : '';
        const exprStr = `"${item.expression.replace(/"/g, '""')}"`;
        const resStr = `"${item.result.replace(/"/g, '""')}"`;
        const favStr = item.isFavorite ? 'Yes' : 'No';
        return `${dateStr},${timeStr},${labelStr},${exprStr},${resStr},${favStr}`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PolyCalc_History_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const favoriteItems = useMemo(() => history.filter(item => item.isFavorite), [history]);

  // Clean Minimalism Keypad Button
  const CalcButton = ({
    children,
    onClick,
    type = 'num',
    className = '',
    ariaLabel
  }: {
    children: React.ReactNode;
    onClick: () => void;
    type?: 'num' | 'op' | 'clear' | 'equals' | 'sci';
    className?: string;
    ariaLabel?: string;
  }) => {
    let styleClasses = '';
    if (type === 'num') {
      styleClasses = 'bg-transparent text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-black/5 dark:hover:bg-white/5';
    } else if (type === 'op') {
      styleClasses = 'bg-[var(--operator-bg)] text-[var(--accent)] hover:opacity-85 font-semibold';
    } else if (type === 'clear') {
      styleClasses = 'bg-[var(--clear-bg)] text-[var(--clear-text)] hover:opacity-85 font-semibold';
    } else if (type === 'equals') {
      styleClasses = 'bg-[var(--accent)] text-white hover:brightness-105 shadow-sm font-semibold';
    } else if (type === 'sci') {
      styleClasses = 'bg-[var(--operator-bg)] text-[var(--text-primary)] hover:opacity-85 text-base sm:text-lg font-medium';
    }

    return (
      <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`rounded-[18px] text-[18px] sm:text-[20px] font-medium flex items-center justify-center transition-all duration-150 active:scale-95 select-none h-14 sm:h-16 ${styleClasses} ${className}`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 transition-colors duration-200`}>
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10 items-stretch justify-center">

        {/* --- CALCULATOR CARD --- */}
        <section className={`w-full ${isScientific ? 'max-w-xl' : 'max-w-[460px]'} mx-auto lg:mx-0 flex flex-col bg-[var(--card-bg)] rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-[var(--border-color)] p-6 sm:p-8 transition-all duration-300 relative`}>
          
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tracking-wider text-[#ADB5BD] dark:text-[#6C757D]">CALC.V1</span>
              {/* Scientific Toggle Pill */}
              <button
                onClick={() => setIsScientific(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all ${
                  isScientific 
                    ? 'bg-[#4A90E2] text-white border-[#4A90E2] shadow-sm' 
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[#4A90E2] hover:text-[#4A90E2]'
                }`}
                title="Toggle Scientific Mode"
              >
                <FlaskConical size={14} />
                <span>SCI</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile History Drawer Button (shown on tablet/mobile) */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--operator-bg)] transition-colors relative"
                aria-label="Open History"
                title="Open History"
              >
                <HistoryIcon size={19} />
                {history.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#4A90E2]" />
                )}
              </button>

              {/* Theme Toggle Slider */}
              <button
                onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
                className="w-12 h-6 bg-[#E0E0E0] dark:bg-[#343A40] rounded-full relative p-0.5 cursor-pointer transition-colors focus:outline-none"
                aria-label="Toggle Theme"
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-700"
                  animate={{ x: theme === 'dark' ? 24 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {theme === 'light' ? <Sun size={12} className="text-amber-500" /> : <Moon size={12} className="text-slate-800" />}
                </motion.div>
              </button>
            </div>
          </header>

          {/* Display Viewport */}
          <div className="mb-6 flex flex-col justify-end text-right min-h-[120px] px-2 select-text">
            <div className="text-[16px] sm:text-[18px] font-normal text-[var(--text-secondary)] mb-1 h-7 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none">
              {expression || '\u00A0'}
            </div>
            
            <div 
              className={`text-[46px] sm:text-[58px] lg:text-[64px] font-light tracking-[-1px] leading-tight break-all transition-all duration-150 ${
                display.length > 10 ? 'text-[36px] sm:text-[44px]' : ''
              }`}
            >
              {formatDisplay(display)}
            </div>

            {/* Error Message */}
            {errorMessage ? (
              <div className="text-[14px] text-[var(--clear-text)] mt-1 font-medium flex items-center justify-end gap-1.5 animate-fadeIn">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            ) : (
              <div className="h-5" />
            )}
          </div>

          {/* Keypad Grid */}
          <div className={`grid gap-2.5 sm:gap-3 flex-1 ${isScientific ? 'grid-cols-6' : 'grid-cols-4'}`}>
            
            {/* ROW 1 */}
            {isScientific && (
              <>
                <CalcButton type="sci" onClick={handleOpenParen} ariaLabel="Open parenthesis">(</CalcButton>
                <CalcButton type="sci" onClick={handleCloseParen} ariaLabel="Close parenthesis">)</CalcButton>
              </>
            )}
            <CalcButton type="clear" onClick={handleClear} ariaLabel="Clear">C</CalcButton>
            <CalcButton type="op" onClick={handleToggleSign} ariaLabel="Positive negative toggle">+/−</CalcButton>
            <CalcButton type="op" onClick={handlePercent} ariaLabel="Percentage">%</CalcButton>
            <CalcButton type="op" onClick={() => handleOperator('÷')} ariaLabel="Divide">÷</CalcButton>

            {/* ROW 2 */}
            {isScientific && (
              <>
                <CalcButton type="sci" onClick={handleSqrt} ariaLabel="Square root">√</CalcButton>
                <CalcButton type="sci" onClick={handlePower} ariaLabel="Power">xʸ</CalcButton>
              </>
            )}
            <CalcButton onClick={() => handleNumber('7')}>7</CalcButton>
            <CalcButton onClick={() => handleNumber('8')}>8</CalcButton>
            <CalcButton onClick={() => handleNumber('9')}>9</CalcButton>
            <CalcButton type="op" onClick={() => handleOperator('×')} ariaLabel="Multiply">×</CalcButton>

            {/* ROW 3 */}
            {isScientific && (
              <>
                <CalcButton type="sci" onClick={handleLog} ariaLabel="Log base 10">log</CalcButton>
                <CalcButton type="sci" onClick={handleLn} ariaLabel="Natural log">ln</CalcButton>
              </>
            )}
            <CalcButton onClick={() => handleNumber('4')}>4</CalcButton>
            <CalcButton onClick={() => handleNumber('5')}>5</CalcButton>
            <CalcButton onClick={() => handleNumber('6')}>6</CalcButton>
            <CalcButton type="op" onClick={() => handleOperator('−')} ariaLabel="Subtract">−</CalcButton>

            {/* ROW 4 */}
            {isScientific && (
              <>
                <CalcButton type="sci" onClick={() => handleConstant('π')} ariaLabel="Pi constant">π</CalcButton>
                <CalcButton type="sci" onClick={() => handleConstant('e')} ariaLabel="Euler constant">e</CalcButton>
              </>
            )}
            <CalcButton onClick={() => handleNumber('1')}>1</CalcButton>
            <CalcButton onClick={() => handleNumber('2')}>2</CalcButton>
            <CalcButton onClick={() => handleNumber('3')}>3</CalcButton>
            <CalcButton type="op" onClick={() => handleOperator('+')} ariaLabel="Add">+</CalcButton>

            {/* ROW 5 */}
            {isScientific && (
              <>
                <CalcButton type="sci" onClick={handleSquare} ariaLabel="Square">x²</CalcButton>
                <CalcButton type="sci" onClick={handleInverse} ariaLabel="Reciprocal">1/x</CalcButton>
              </>
            )}
            <CalcButton onClick={() => handleNumber('0')} className="col-span-2 !justify-start pl-7 sm:pl-8">0</CalcButton>
            <CalcButton onClick={handleDecimal}>.</CalcButton>
            <CalcButton type="equals" onClick={handleEquals} ariaLabel="Equals">=</CalcButton>
          </div>

          {/* Quick backspace footer affordance */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
            <span className="hidden sm:inline">Keyboard supported (0-9, +, -, *, /, Enter)</span>
            <button
              onClick={handleBackspace}
              className="flex items-center gap-1.5 text-xs hover:text-[var(--text-primary)] transition-colors py-1 px-2 rounded-lg ml-auto"
              title="Delete last digit"
            >
              <Delete size={14} />
              <span>Backspace</span>
            </button>
          </div>
        </section>

        {/* --- DESKTOP SIDEBAR PANELS (Clean Minimalism) --- */}
        <aside className="w-full lg:w-[360px] hidden lg:flex flex-col gap-6">
          
          {/* History Panel */}
          <div className="bg-[var(--card-bg)] rounded-[24px] p-6 flex-1 flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[var(--border-color)] max-h-[380px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
              <h3 className="text-xs uppercase tracking-[1px] font-bold text-[var(--text-secondary)]">
                History
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportHistoryCSV}
                  disabled={history.length === 0}
                  className="text-xs text-[var(--accent)] font-semibold hover:underline disabled:opacity-40 disabled:hover:no-underline flex items-center gap-1"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-[var(--clear-text)] hover:underline opacity-80"
                    title="Clear history"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-1">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-secondary)] opacity-60">
                  <RotateCcw size={32} strokeWidth={1.5} className="mb-2" />
                  <p className="text-sm">No calculations yet</p>
                </div>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl hover:bg-[var(--operator-bg)] transition-colors flex items-center justify-between group border-b border-[var(--border-color)] last:border-b-0"
                  >
                    <div 
                      onClick={() => reuseResult(item.result)}
                      className="flex-1 cursor-pointer pr-2 overflow-hidden"
                      title="Click to reuse result"
                    >
                      <div className="text-[13px] text-[var(--text-secondary)] truncate">{item.expression}</div>
                      <div className="text-[16px] font-medium text-[var(--text-primary)]">={item.result}</div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'
                        }`}
                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star size={16} fill={item.isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete calculation"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Saved Favorites Panel */}
          <div className="bg-[var(--card-bg)] rounded-[24px] p-6 flex-[0.8] flex flex-col shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-[var(--border-color)] max-h-[300px]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[var(--border-color)]">
              <h3 className="text-xs uppercase tracking-[1px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span>Saved Favorites ({favoriteItems.length})</span>
              </h3>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-1">
              {favoriteItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-secondary)] opacity-60">
                  <Star size={28} strokeWidth={1.5} className="mb-2" />
                  <p className="text-sm">Star calculations to save them here</p>
                </div>
              ) : (
                favoriteItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl hover:bg-[var(--operator-bg)] transition-colors flex items-center justify-between group border-b border-[var(--border-color)] last:border-b-0"
                  >
                    <div 
                      onClick={() => reuseResult(item.result)}
                      className="flex-1 cursor-pointer pr-2 overflow-hidden"
                      title="Click to reuse result"
                    >
                      {editingLabelId === item.id ? (
                        <div className="flex items-center gap-1 my-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempLabel}
                            onChange={e => setTempLabel(e.target.value)}
                            placeholder="Add label (e.g. Tax 15%)"
                            className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border border-[var(--border-color)] rounded focus:outline-none w-full"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveLabel(item.id);
                              if (e.key === 'Escape') setEditingLabelId(null);
                            }}
                          />
                          <button
                            onClick={() => saveLabel(item.id)}
                            className="p-1 text-green-500 hover:bg-green-50 rounded"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-[13px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
                          <span>{item.label || item.expression}</span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setEditingLabelId(item.id);
                              setTempLabel(item.label || '');
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[var(--accent)]"
                            title="Edit label"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                      <div className="text-[15px] font-medium text-[var(--text-primary)]">={item.result}</div>
                    </div>

                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className="p-1.5 rounded-lg text-amber-400 hover:text-gray-300 transition-colors"
                      title="Remove from favorites"
                    >
                      <Star size={16} fill="currentColor" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* --- MOBILE HISTORY & FAVORITES DRAWER --- */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 240 }}
                className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[var(--card-bg)] rounded-t-[28px] shadow-2xl z-50 flex flex-col p-6 border-t border-[var(--border-color)] lg:hidden"
              >
                {/* Grab handle affordance */}
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex bg-[var(--operator-bg)] p-1 rounded-xl">
                    <button
                      onClick={() => setMobileTab('history')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        mobileTab === 'history' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      History ({history.length})
                    </button>
                    <button
                      onClick={() => setMobileTab('favorites')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        mobileTab === 'favorites' ? 'bg-[var(--card-bg)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      Favorites ({favoriteItems.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--operator-bg)]"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Drawer Content */}
                <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[50vh]">
                  {mobileTab === 'history' ? (
                    history.length === 0 ? (
                      <div className="text-center py-10 text-[var(--text-secondary)] opacity-60">
                        <RotateCcw size={32} className="mx-auto mb-2" />
                        <p className="text-sm">No calculations recorded yet</p>
                      </div>
                    ) : (
                      history.map(item => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-[var(--operator-bg)]/40 flex items-center justify-between"
                        >
                          <div 
                            onClick={() => reuseResult(item.result)}
                            className="flex-1 cursor-pointer pr-3"
                          >
                            <div className="text-xs text-[var(--text-secondary)]">{item.expression}</div>
                            <div className="text-lg font-medium text-[var(--text-primary)]">={item.result}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className={`p-2 rounded-lg ${item.isFavorite ? 'text-amber-400' : 'text-gray-400'}`}
                            >
                              <Star size={18} fill={item.isFavorite ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )
                  ) : favoriteItems.length === 0 ? (
                    <div className="text-center py-10 text-[var(--text-secondary)] opacity-60">
                      <Star size={32} className="mx-auto mb-2" />
                      <p className="text-sm">No saved favorite calculations</p>
                    </div>
                  ) : (
                    favoriteItems.map(item => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-[var(--operator-bg)]/40 flex items-center justify-between"
                      >
                        <div 
                          onClick={() => reuseResult(item.result)}
                          className="flex-1 cursor-pointer pr-3"
                        >
                          <div className="text-xs text-[var(--text-secondary)]">{item.label || item.expression}</div>
                          <div className="text-lg font-medium text-[var(--text-primary)]">={item.result}</div>
                        </div>
                        <button
                          onClick={() => toggleFavorite(item.id)}
                          className="p-2 rounded-lg text-amber-400"
                        >
                          <Star size={18} fill="currentColor" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Mobile Drawer Actions */}
                <div className="pt-4 mt-2 border-t border-[var(--border-color)] flex gap-3">
                  <button
                    onClick={exportHistoryCSV}
                    disabled={history.length === 0}
                    className="flex-1 py-3 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Download size={16} />
                    <span>Export CSV</span>
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="py-3 px-4 bg-[var(--clear-bg)] text-[var(--clear-text)] rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={16} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
