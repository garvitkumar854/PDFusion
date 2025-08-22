
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Percent, History } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type HistoryEntry = {
    expression: string;
    result: string;
}

const CalculatorButton = ({
  children,
  onClick,
  className,
  variant = 'secondary',
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link' | null | undefined
}) => (
  <motion.div whileTap={{ scale: 0.95 }}>
    <Button
      onClick={onClick}
      className={cn(
        'w-full h-16 text-2xl rounded-2xl shadow-sm hover:shadow-md transition-shadow',
        className
      )}
      variant={variant}
    >
      {children}
    </Button>
  </motion.div>
);
CalculatorButton.displayName = "CalculatorButton";


export function Calculator() {
  const [expression, setExpression] = useState('0');
  const [result, setResult] = useState('0');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isFinal, setIsFinal] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);

  const calculate = useCallback((exp: string): string => {
    try {
      let sanitizedExp = exp
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/--/g, '+')
        .replace(/\+-/g, '-')
        .replace(/\+\+/g, '+')
        .replace(/-\+/g, '-');
        
      if (/[+/*-]$/.test(sanitizedExp)) {
        sanitizedExp = sanitizedExp.slice(0, -1);
      }

      if (!sanitizedExp || sanitizedExp === 'Error' || sanitizedExp === '0') {
        return "0";
      }

      const calculatedResult = new Function('return ' + sanitizedExp)();
      if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
        return "Error";
      }
      return String(parseFloat(calculatedResult.toPrecision(15)));
    } catch (error) {
      return "0";
    }
  }, []);
  
  useEffect(() => {
    if (!isFinal) {
      const calculatedResult = calculate(expression);
      setResult(calculatedResult);
    }
  }, [expression, isFinal, calculate]);


 const handleInput = (value: string) => {
    if (isFinal) {
        setHistory(prev => [{ expression: expression, result: result }, ...prev]);
        setExpression(value);
        setIsFinal(false);
        return;
    }
    
    if (expression === '0' && value === '0') return;
    setExpression(prev => (prev === '0' && value !== '.' ? value : prev + value));
  };
  
  const handleOperator = (op: string) => {
    if (result === 'Error') {
        handleClear();
        return;
    }

    if (isFinal) {
        setHistory(prev => [{ expression: expression, result: result }, ...prev]);
        setExpression(result + op);
        setIsFinal(false);
    } else {
        setExpression(prev => {
            const lastChar = prev.slice(-1);
            if (['+', '-', '×', '÷'].includes(lastChar)) {
                return prev.slice(0, -1) + op;
            }
            return prev + op;
        });
    }
  };

  const handleEquals = () => {
    if (isFinal || result === 'Error') return;
    setResult(calculate(expression));
    setIsFinal(true);
  };

  const handleClear = () => {
    const isAllClear = expression === '0' && history.length === 0;
    if (expression === '0' && !isAllClear) {
        setHistory([]);
    }
    setExpression('0');
    setResult('0');
    setIsFinal(false);
  };
  
  const handleBackspace = () => {
    if (result === "Error") {
        handleClear();
        return;
    }
    if (isFinal) {
        setExpression(result);
        setIsFinal(false);
        return;
    }
    setExpression(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handlePercentage = () => {
     if (result === "Error") return;
     if (isFinal) {
        setExpression(String(parseFloat(result) / 100));
     } else {
        setExpression(prev => String(parseFloat(calculate(prev)) / 100));
     }
     setIsFinal(false);
  };

  const handleDecimal = () => {
    if (isFinal) {
      setHistory(prev => [{ expression: expression, result: result }, ...prev]);
      setExpression('0.');
      setIsFinal(false);
      return;
    }
    const segments = expression.split(/([+\-×÷])/);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment.includes('.')) {
        setExpression(prev => prev + '.');
    }
  };

  const displayVariants = {
    initial: { fontSize: '2.5rem', opacity: 1 },
    animate: { fontSize: isFinal ? '1.5rem' : '2.5rem', opacity: isFinal ? 0.7 : 1 },
    transition: { type: 'spring', stiffness: 350, damping: 35 }
  };

  const resultVariants = {
    initial: { fontSize: '1.5rem', opacity: 0.7 },
    animate: { fontSize: isFinal ? '2.5rem' : '1.5rem', opacity: isFinal ? 1 : 0.7, color: isFinal ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' },
    transition: { type: 'spring', stiffness: 350, damping: 35 }
  };

  const clearButtonLabel = expression === '0' && history.length === 0 ? 'AC' : 'C';
  const showResult = (expression !== '0' && expression !== result) || isFinal;
  
  const operatorButtonsClass = "bg-transparent text-primary hover:bg-primary hover:text-primary-foreground";
  const numberButtonsClass = "bg-transparent hover:bg-primary hover:text-primary-foreground";


  return (
    <Card className="bg-transparent shadow-lg p-4">
      <CardContent className="p-0">
        <div className="relative bg-muted text-right rounded-lg p-4 mb-4 shadow-inner h-48 flex flex-col justify-end overflow-hidden">
            <motion.div
                className="font-bold break-all text-foreground"
                layout
                variants={displayVariants}
                initial="initial"
                animate="animate"
                transition={displayVariants.transition}
            >
                {expression}
            </motion.div>
            <AnimatePresence>
              {showResult && (
                <motion.div
                    className="font-bold break-all"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    variants={resultVariants}
                    transition={resultVariants.transition}
                >
                    = {result}
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <CalculatorButton onClick={handleClear} variant="destructive" className="transition-all">
            {clearButtonLabel}
          </CalculatorButton>
          <CalculatorButton onClick={handleBackspace} variant={'ghost'} className={operatorButtonsClass}><Eraser className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={handlePercentage} variant={'ghost'} className={operatorButtonsClass}><Percent className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('÷')} variant={'ghost'} className={operatorButtonsClass}>÷</CalculatorButton>
          
          <CalculatorButton onClick={() => handleInput('7')} variant={'ghost'} className={numberButtonsClass}>7</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('8')} variant={'ghost'} className={numberButtonsClass}>8</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('9')} variant={'ghost'} className={numberButtonsClass}>9</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('×')} variant={'ghost'} className={operatorButtonsClass}>×</CalculatorButton>

          <CalculatorButton onClick={() => handleInput('4')} variant={'ghost'} className={numberButtonsClass}>4</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('5')} variant={'ghost'} className={numberButtonsClass}>5</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('6')} variant={'ghost'} className={numberButtonsClass}>6</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('-')} variant={'ghost'} className={operatorButtonsClass}>−</CalculatorButton>

          <CalculatorButton onClick={() => handleInput('1')} variant={'ghost'} className={numberButtonsClass}>1</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('2')} variant={'ghost'} className={numberButtonsClass}>2</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('3')} variant={'ghost'} className={numberButtonsClass}>3</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('+')} variant={'ghost'} className={operatorButtonsClass}>+</CalculatorButton>

          <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
              <SheetTrigger asChild>
                  <div className="col-span-1">
                    <CalculatorButton onClick={() => {}} variant={'ghost'} className={operatorButtonsClass}><History className="w-6 h-6"/></CalculatorButton>
                  </div>
              </SheetTrigger>
              <SheetContent className="flex flex-col p-0">
                  <SheetHeader className="p-6 pb-2 text-left">
                      <SheetTitle>History</SheetTitle>
                  </SheetHeader>
                  {history.length > 0 ? (
                      <div className="flex-1 overflow-y-auto px-6">
                        {history.map((entry, index) => (
                           <div key={index} className="border-b py-3 text-right">
                               <p className="text-muted-foreground text-sm">{entry.expression}</p>
                               <p className="font-bold text-lg">= {entry.result}</p>
                           </div>
                        ))}
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                          <History className="w-12 h-12 mb-4"/>
                          <p>No history yet.</p>
                          <p className="text-sm">Your past calculations will appear here.</p>
                      </div>
                  )}
                  <div className="p-4 border-t">
                      <Button variant="outline" className="w-full" onClick={() => setHistory([])}>Clear History</Button>
                  </div>
              </SheetContent>
          </Sheet>
          <CalculatorButton onClick={() => handleInput('0')} variant={'ghost'} className={numberButtonsClass}>0</CalculatorButton>
          <CalculatorButton onClick={handleDecimal} variant={'ghost'} className={numberButtonsClass}>.</CalculatorButton>
          <CalculatorButton onClick={handleEquals} variant={'ghost'} className={cn("text-primary", operatorButtonsClass)}>=</CalculatorButton>
        </div>
      </CardContent>
    </Card>
  );
}
