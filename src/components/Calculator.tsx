
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Eraser } from 'lucide-react';

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

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  
  const clearEntry = () => {
    setDisplay('0');
  }

  const backspace = () => {
    setDisplay(display.slice(0, -1) || '0');
  }

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      setCurrentValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (firstOperand: number, secondOperand: number, op: string) => {
    switch (op) {
      case '+':
        return firstOperand + secondOperand;
      case '-':
        return firstOperand - secondOperand;
      case '*':
        return firstOperand * secondOperand;
      case '/':
        return firstOperand / secondOperand;
      default:
        return secondOperand;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (operator && currentValue !== null) {
      const result = calculate(currentValue, inputValue, operator);
      setDisplay(String(result));
      setCurrentValue(result);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  return (
    <Card className="bg-transparent shadow-lg p-4">
      <CardContent className="p-0">
        <div className="bg-muted text-right rounded-lg p-4 mb-4 shadow-inner">
          <motion.div 
            key={display}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold break-all"
          >
            {display}
          </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <CalculatorButton onClick={clearAll} variant="destructive">C</CalculatorButton>
          <CalculatorButton onClick={clearEntry}>CE</CalculatorButton>
          <CalculatorButton onClick={backspace}><Eraser className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={() => performOperation('/')} variant="default" className="bg-primary/90">÷</CalculatorButton>
          
          <CalculatorButton onClick={() => inputDigit('7')}>7</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('8')}>8</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('9')}>9</CalculatorButton>
          <CalculatorButton onClick={() => performOperation('*')} variant="default" className="bg-primary/90">×</CalculatorButton>

          <CalculatorButton onClick={() => inputDigit('4')}>4</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('5')}>5</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('6')}>6</CalculatorButton>
          <CalculatorButton onClick={() => performOperation('-')} variant="default" className="bg-primary/90">−</CalculatorButton>

          <CalculatorButton onClick={() => inputDigit('1')}>1</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('2')}>2</CalculatorButton>
          <CalculatorButton onClick={() => inputDigit('3')}>3</CalculatorButton>
          <CalculatorButton onClick={() => performOperation('+')} variant="default" className="bg-primary/90">+</CalculatorButton>

          <div className="col-span-2">
            <CalculatorButton onClick={() => inputDigit('0')}>0</CalculatorButton>
          </div>
          <CalculatorButton onClick={inputDecimal}>.</CalculatorButton>
          <CalculatorButton onClick={handleEquals} variant="default">=</CalculatorButton>
        </div>
      </CardContent>
    </Card>
  );
}
