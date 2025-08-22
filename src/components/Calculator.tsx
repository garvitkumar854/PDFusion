
"use client";

import React, { useState, useEffect } from 'react';
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
  const [expression, setExpression] = useState('0');
  const [result, setResult] = useState('0');
  const [isFinal, setIsFinal] = useState(false);

  const calculate = (exp: string): string => {
    try {
      // Replace display symbols with JS-compatible ones
      const sanitizedExp = exp.replace(/×/g, '*').replace(/÷/g, '/');
      // Use Function to avoid eval security risks
      const calculatedResult = new Function('return ' + sanitizedExp)();
      // Handle floating point inaccuracies
      return String(parseFloat(calculatedResult.toPrecision(15)));
    } catch (error) {
      return result; // Return last valid result on error
    }
  };
  
  useEffect(() => {
    if (!isFinal) {
      setResult(calculate(expression));
    }
  }, [expression, isFinal]);


  const handleInput = (value: string) => {
    if (isFinal) {
      setExpression(value);
      setIsFinal(false);
    } else {
      setExpression(prev => (prev === '0' ? value : prev + value));
    }
  };
  
  const handleOperator = (op: string) => {
    setIsFinal(false);
    setExpression(prev => {
        // Prevent multiple operators in a row
        const lastChar = prev.slice(-1);
        if (['+', '-', '×', '÷'].includes(lastChar)) {
            return prev.slice(0, -1) + op;
        }
        return prev + op;
    });
  };

  const handleEquals = () => {
    setIsFinal(true);
    setExpression(result);
  };

  const handleClearAll = () => {
    setExpression('0');
    setResult('0');
    setIsFinal(false);
  };
  
  const handleBackspace = () => {
    if (isFinal) {
        handleClearAll();
        return;
    }
    setExpression(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handlePercentage = () => {
     if (isFinal) {
        setExpression(prev => String(parseFloat(prev) / 100));
     } else {
        // More complex logic would be needed for in-expression percentages
        // For now, it works on the final result or a single number
        setExpression(prev => String(parseFloat(prev) / 100));
     }
     setIsFinal(false);
  };

  const handleDecimal = () => {
    if (isFinal) {
      setExpression('0.');
      setIsFinal(false);
      return;
    }
    // Logic to prevent multiple decimals in one number segment
    const segments = expression.split(/([+\-×÷])/);
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment.includes('.')) {
        setExpression(prev => prev + '.');
    }
  };

  const displayVariants = {
    initial: (isFinal: boolean) => ({ fontSize: isFinal ? '1.5rem' : '2.5rem', opacity: isFinal ? 0.7 : 1 }),
    animate: (isFinal: boolean) => ({ fontSize: isFinal ? '1.5rem' : '2.5rem', opacity: isFinal ? 0.7 : 1 }),
  };

  const resultVariants = {
    initial: (isFinal: boolean) => ({ fontSize: isFinal ? '2.5rem' : '1.5rem', opacity: isFinal ? 1 : 0.7 }),
    animate: (isFinal: boolean) => ({ fontSize: isFinal ? '2.5rem' : '1.5rem', opacity: isFinal ? 1 : 0.7 }),
  };


  return (
    <Card className="bg-transparent shadow-lg p-4">
      <CardContent className="p-0">
        <div className="bg-muted text-right rounded-lg p-4 mb-4 shadow-inner h-36 flex flex-col justify-end">
            <motion.div
                className="font-bold break-all text-foreground"
                custom={isFinal}
                initial="initial"
                animate="animate"
                variants={displayVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {expression}
            </motion.div>
            <motion.div
                className="font-bold break-all text-muted-foreground"
                custom={isFinal}
                initial="initial"
                animate="animate"
                variants={resultVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                = {result}
            </motion.div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <CalculatorButton onClick={handleClearAll} variant="destructive">C</CalculatorButton>
          <CalculatorButton onClick={handleBackspace}><Eraser className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={handlePercentage}><Percent className="w-6 h-6"/></CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('÷')} variant="default" className="bg-primary/90">÷</CalculatorButton>
          
          <CalculatorButton onClick={() => handleInput('7')}>7</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('8')}>8</CalculatorButton>
          <CalculatorButton onClick={() => handleInput('9')}>9</CalculatorButton>
          <CalculatorButton onClick={() => handleOperator('×')} variant="default" className="bg-primary/90">×</CalculatorButton>

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
