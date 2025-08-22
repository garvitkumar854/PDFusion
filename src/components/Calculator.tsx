
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Eraser, Percent } from 'lucide-react';

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
  const [input, setInput] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [isResult, setIsResult] = useState(false);


  const calculate = (first: number, second: number, op: string): number => {
    switch (op) {
      case '+': return first + second;
      case '-': return first - second;
      case '*': return first * second;
      case '/': return first / second;
      default: return second;
    }
  };

  const handleInput = (value: string) => {
     if (isResult) {
       setInput(value);
       setIsResult(false);
     } else {
       setInput(input === '0' ? value : input + value);
     }
  };

  const handleDecimal = () => {
    if (isResult) {
      setInput('0.');
      setIsResult(false);
    } else if (!input.includes('.')) {
      setInput(input + '.');
    }
  }

  const handleOperator = (op: string) => {
    if (result !== null && operator && !isResult) {
        const currentInput = parseFloat(input);
        const currentResult = parseFloat(result);
        const newResult = calculate(currentResult, currentInput, operator);
        setResult(String(newResult));
        setInput(String(newResult));
    } else {
       setResult(input);
    }
    setInput('0');
    setOperator(op);
    setIsResult(false);
  };
  
  const handleEquals = () => {
    if (operator && result !== null) {
        const currentInput = parseFloat(input);
        const currentResult = parseFloat(result);
        const newResult = calculate(currentResult, currentInput, operator);
        setResult(null);
        setOperator(null);
        setInput(String(newResult));
        setIsResult(true);
    }
  };

  const handleClearAll = () => {
    setInput('0');
    setResult(null);
    setOperator(null);
    setIsResult(false);
  };
  
  const handleBackspace = () => {
    if (isResult) {
      handleClearAll();
    } else {
      setInput(input.length > 1 ? input.slice(0, -1) : '0');
    }
  };

  const handlePercentage = () => {
    const currentValue = parseFloat(input);
    const newValue = currentValue / 100;
    setInput(String(newValue));
    setIsResult(true); 
  };


  const getDisplayCalculation = () => {
    if(operator && result !== null) {
      return `${result} ${operator}`;
    }
    return ' ';
  }
  
  const displayVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };
  
  const resultDisplayVariants = {
    initial: { y: -20, opacity: 0.5 },
    animate: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0.5, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <Card className="bg-transparent shadow-lg p-4">
      <CardContent className="p-0">
        <div className="bg-muted text-right rounded-lg p-4 mb-4 shadow-inner h-28 flex flex-col justify-end">
           <AnimatePresence>
            <motion.div
                key={isResult ? "result" : "calculation"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="text-lg h-6"
            >
                {!isResult ? getDisplayCalculation() : ' '}
            </motion.div>
           </AnimatePresence>

           <motion.div
             key={input}
             variants={isResult ? resultDisplayVariants : displayVariants}
             initial="initial"
             animate="animate"
             exit="exit"
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
             className="text-4xl font-bold break-all"
            >
                {input}
           </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <CalculatorButton onClick={handleClearAll} variant="destructive">C</CalculatorButton>
          <CalculatorButton onClick={handleBackspace}><Eraser className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={handlePercentage}><Percent className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('/')} variant="default" className="bg-primary/90">÷</CalculatorButton>
          
          <CalculatorButton onClick={() => handleInput('7')}>7</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('8')}>8</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('9')}>9</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('*')} variant="default" className="bg-primary/90">×</CalculatorButton>

          <CalculatorButton onClick={() => handleInput('4')}>4</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('5')}>5</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('6')}>6</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('-')} variant="default" className="bg-primary/90">−</CalculatorButton>

          <CalculatorButton onClick={() => handleInput('1')}>1</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('2')}>2</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('3')}>3</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('+')} variant="default" className="bg-primary/90">+</CalculatorButton>

          <div className="col-span-2">
            <CalculatorButton onClick={() => handleInput('0')}>0</CalculatorButton>
          </div>
          <CalculatorButton onClick={handleDecimal}>.</CalculatorButton>
          <CalculatorButton onClick={handleEquals} variant="default">=</CalculatorButton>
        </div>
      </CardContent>
    </Card>
  );
}
