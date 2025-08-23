

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Category, convert, formatNumber, Unit } from "@/lib/unit-data";
import { ArrowRightLeft, Delete } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type InputState = {
    value: string;
    unit: string;
};

const initialStates: Record<Category['id'], { from: InputState, to: InputState }> = {
    length: { from: { value: '1', unit: 'meters' }, to: { value: '', unit: 'feet' } },
    mass: { from: { value: '1', unit: 'kilograms' }, to: { value: '', unit: 'pounds' } },
    temperature: { from: { value: '0', unit: 'celsius' }, to: { value: '', unit: 'fahrenheit' } },
    time: { from: { value: '1', unit: 'seconds' }, to: { value: '', unit: 'minutes' } },
    volume: { from: { value: '1', unit: 'liters' }, to: { value: '', unit: 'gallons-us' } },
    speed: { from: { value: '1', unit: 'kph' }, to: { value: '', unit: 'miles-per-hour' } },
    area: { from: { value: '1', unit: 'sq-meters' }, to: { value: '', unit: 'sq-feet' } },
    data: { from: { value: '1024', unit: 'megabytes' }, to: { value: '', unit: 'gigabytes' } },
    'numeral-system': { from: { value: '10', unit: 'decimal' }, to: { value: '', unit: 'binary' } },
};

const CalculatorButton = React.memo(({ children, className, ...props }: React.ComponentProps<typeof Button>) => (
    <Button
        className={cn("h-full w-full text-2xl font-bold rounded-2xl shadow-sm", className)}
        variant="secondary"
        {...props}
    >
        {children}
    </Button>
));
CalculatorButton.displayName = 'CalculatorButton';

const NumeralCalculator = React.memo(({ onInput, activeUnit }: { onInput: (key: string) => void; activeUnit: string }) => {
    const isButtonDisabled = (key: string) => {
        if (key === '.') return true;
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(key)) {
            return activeUnit !== 'hexadecimal';
        }
        const numKey = parseInt(key, 10);
        if (isNaN(numKey)) return false;

        if (activeUnit === 'binary') return numKey > 1;
        if (activeUnit === 'octal') return numKey > 7;

        return false;
    };

    const keys: (string | {key:string, icon:React.ReactNode, label: string})[] = [
        { key: 'AC', icon: 'AC', label: 'Clear' }, { key: 'Bksce', icon: <Delete className="h-7 w-7"/>, label: 'Backspace' }, 'F', 'E',
        '7', '8', '9', 'D',
        '4', '5', '6', 'C',
        '1', '2', '3', 'B',
        { key: 'Swap', icon: <ArrowRightLeft className="h-7 w-7"/>, label: 'Swap' }, '0', '.', 'A',
    ];

    return (
        <div className="grid grid-cols-4 grid-rows-5 gap-2 h-full">
            {keys.map((keyInfo, index) => {
                const key = typeof keyInfo === 'object' ? keyInfo.key : keyInfo;
                const icon = typeof keyInfo === 'object' ? keyInfo.icon : key;
                const disabled = isButtonDisabled(key);

                let buttonStyle = 'bg-muted/60 text-foreground';
                if (key === 'AC') buttonStyle = "bg-red-500/80 hover:bg-red-500 text-white";
                else if (['Bksce', 'Swap'].includes(key)) buttonStyle = 'bg-muted/60 text-primary';
                else if (disabled) buttonStyle = cn(buttonStyle, "opacity-40 pointer-events-none");

                return (
                    <CalculatorButton
                        key={`${key}-${index}`}
                        onClick={() => onInput(key)}
                        className={buttonStyle}
                        disabled={disabled}
                        aria-label={typeof keyInfo === 'object' ? keyInfo.label : key}
                    >
                        {icon}
                    </CalculatorButton>
                )
            })}
        </div>
    );
});
NumeralCalculator.displayName = 'NumeralCalculator';

const StandardCalculator = React.memo(({ onInput, activeCategory }: { onInput: (key: string) => void; activeCategory: Category['id'] }) => {
    const isTemp = activeCategory === 'temperature';
    const baseBtnClass = 'bg-muted/60 text-foreground hover:bg-muted/80';

    return (
        <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full">
            <CalculatorButton onClick={() => onInput('7')} className={cn(baseBtnClass, 'col-start-1 row-start-1')}>7</CalculatorButton>
            <CalculatorButton onClick={() => onInput('8')} className={cn(baseBtnClass, 'col-start-2 row-start-1')}>8</CalculatorButton>
            <CalculatorButton onClick={() => onInput('9')} className={cn(baseBtnClass, 'col-start-3 row-start-1')}>9</CalculatorButton>

            <CalculatorButton onClick={() => onInput('4')} className={cn(baseBtnClass, 'col-start-1 row-start-2')}>4</CalculatorButton>
            <CalculatorButton onClick={() => onInput('5')} className={cn(baseBtnClass, 'col-start-2 row-start-2')}>5</CalculatorButton>
            <CalculatorButton onClick={() => onInput('6')} className={cn(baseBtnClass, 'col-start-3 row-start-2')}>6</CalculatorButton>

            <CalculatorButton onClick={() => onInput('1')} className={cn(baseBtnClass, 'col-start-1 row-start-3')}>1</CalculatorButton>
            <CalculatorButton onClick={() => onInput('2')} className={cn(baseBtnClass, 'col-start-2 row-start-3')}>2</CalculatorButton>
            <CalculatorButton onClick={() => onInput('3')} className={cn(baseBtnClass, 'col-start-3 row-start-3')}>3</CalculatorButton>

            <CalculatorButton onClick={() => onInput('Swap')} className={cn(baseBtnClass, 'col-start-1 row-start-4 text-primary')}><ArrowRightLeft className="h-7 w-7"/></CalculatorButton>
            <CalculatorButton onClick={() => onInput('0')} className={cn(baseBtnClass, 'col-start-2 row-start-4')}>0</CalculatorButton>
            <CalculatorButton onClick={() => onInput('.')} className={cn(baseBtnClass, 'col-start-3 row-start-4')}>.</CalculatorButton>

            <CalculatorButton onClick={() => onInput('C')} className="bg-red-500/80 hover:bg-red-500 text-white col-start-4 row-start-1 row-span-2">AC</CalculatorButton>
            {isTemp ? (
                <>
                    <CalculatorButton onClick={() => onInput('Bksce')} className={cn(baseBtnClass, "col-start-4 row-start-3")}><Delete className="h-7 w-7"/></CalculatorButton>
                    <CalculatorButton onClick={() => onInput('+/-')} className={cn(baseBtnClass, "col-start-4 row-start-4")}>+/-</CalculatorButton>
                </>
            ) : (
                <CalculatorButton onClick={() => onInput('Bksce')} className={cn(baseBtnClass, "col-start-4 row-start-3 row-span-2")}><Delete className="h-7 w-7"/></CalculatorButton>
            )}
        </div>
    );
});
StandardCalculator.displayName = 'StandardCalculator';


const DisplayPanel = React.memo(({ value, unit, units, onUnitChange, isActive, onClick, onValueChange, isNumeralSystem }: { value: string, unit: string, units: Unit[], onUnitChange: (unit:string) => void, isActive: boolean, onClick: () => void, onValueChange: (value: string) => void, isNumeralSystem: boolean }) => {
    const displayValue = value || '0';
    const [fontSize, setFontSize] = useState('1.875rem');

    useEffect(() => {
        const len = displayValue.length;
        if (len > 18) setFontSize('1rem');
        else if (len > 15) setFontSize('1.125rem');
        else if (len > 12) setFontSize('1.25rem');
        else if (len > 9) setFontSize('1.5rem');
        else setFontSize('1.875rem');
    }, [displayValue]);

    return (
        <div
            className={cn(
                "relative p-4 rounded-lg bg-muted/50 border-2 transition-all h-24 flex flex-col justify-center",
                isActive ? 'border-primary shadow-md' : 'border-transparent'
            )}
            onClick={onClick}
        >
            <div className="flex justify-between items-center">
               <input
                    type={'text'}
                    value={displayValue}
                    onChange={(e) => onValueChange(e.target.value)}
                    className="w-full bg-transparent font-bold truncate transition-all duration-200 focus:outline-none"
                    style={{ fontSize }}
                    readOnly
                />
               <Select value={unit} onValueChange={onUnitChange}>
                    <SelectTrigger className="w-auto border-0 bg-transparent text-base font-semibold pr-0 whitespace-nowrap max-w-[50%]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {units.map(u =>
                          <SelectItem key={u.id} value={u.id}>
                              <div className="flex items-center gap-2">
                                <span>{u.name} ({u.symbol})</span>
                              </div>
                          </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
});
DisplayPanel.displayName = 'DisplayPanel';


export function UnitConverterPwa() {
  const [activeCategory, setActiveCategory] = useState<Category['id']>('length');
  const [from, setFrom] = useState<InputState>(initialStates.length.from);
  const [to, setTo] = useState<InputState>(initialStates.length.to);
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');

  const isNumeralSystem = activeCategory === 'numeral-system';

  const unitsForCategory = useMemo(() => {
    return categories.find(c => c.id === activeCategory)?.units || [];
  }, [activeCategory]);

  const performConversion = useCallback(() => {
    const value = activeInput === 'from' ? from.value : to.value;
    const fromUnit = activeInput === 'from' ? from.unit : to.unit;
    const toUnit = activeInput === 'from' ? to.unit : from.unit;

    const currentUnits = categories.find(c => c.id === activeCategory)?.units;
    if (!currentUnits) return;

    const fromUnitExists = Object.values(currentUnits).some(u => u.id === fromUnit);
    const toUnitExists = Object.values(currentUnits).some(u => u.id === toUnit);

    if (!fromUnitExists || !toUnitExists) return;

    if (!value) {
      if (activeInput === 'from') setTo(prev => ({...prev, value: ''}));
      else setFrom(prev => ({...prev, value: ''}));
      return;
    }

    const result = convert(activeCategory, value, fromUnit, toUnit);
    const formattedResult = formatNumber(result);

    if (activeInput === 'from') {
        setTo(prev => ({ ...prev, value: formattedResult }));
    } else {
        setFrom(prev => ({ ...prev, value: formattedResult }));
    }
  }, [activeCategory, from.value, from.unit, to.value, to.unit, activeInput]);

  useEffect(() => {
    performConversion();
  }, [performConversion]);

  const handleFromUnitChange = useCallback((unit: string) => {
    setFrom(prev => ({...prev, unit, value: ''}));
    setTo(prev => ({...prev, value: ''}));
    setActiveInput('from');
  }, []);

  const handleToUnitChange = useCallback((unit: string) => {
    setTo(prev => ({...prev, unit, value: ''}));
    setFrom(prev => ({...prev, value: ''}));
    setActiveInput('to');
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    const newCategory = categoryId as Category['id'];
    const initial = initialStates[newCategory];

    const currentUnits = categories.find(c => c.id === newCategory)?.units;
    if (!currentUnits) return;

    const fromUnitExists = currentUnits.some(u => u.id === initial.from.unit);
    const toUnitExists = currentUnits.some(u => u.id === initial.to.unit);

    if (fromUnitExists && toUnitExists) {
        setActiveCategory(newCategory);
        setFrom(initial.from);
        setTo(initial.to);
        setActiveInput('from');
    }
  };

  const handleSwap = useCallback(() => {
    const oldFrom = { ...from };
    const oldTo = { ...to };
    setFrom(oldTo);
    setTo(oldFrom);
    setActiveInput(activeInput === 'from' ? 'to' : 'from');
  }, [from, to, activeInput]);

  const handleValueChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<InputState>>,
    activeSetter: () => void
  ) => {
    if (isNumeralSystem) {
        const selectedUnit = activeInput === 'from' ? from.unit : to.unit;
        let regex = /.*/;
        if (selectedUnit === 'binary') regex = /^[01]*$/;
        if (selectedUnit === 'octal') regex = /^[0-7]*$/;
        if (selectedUnit === 'decimal') regex = /^[0-9]*$/;
        if (selectedUnit === 'hexadecimal') regex = /^[0-9a-fA-F]*$/i;
        if (!regex.test(value)) return;
    } else if (activeCategory !== 'temperature' && value.includes('-')) {
        return;
    }
    setter(prev => ({ ...prev, value: value }));
    activeSetter();
  };

  const handleCalculatorInput = useCallback((key: string) => {
    const handler = activeInput === 'from' ? setFrom : setTo;

    if (key === 'Swap') {
      handleSwap();
      return;
    }

    handler(prev => {
        let currentValue = prev.value || '0';

        if (key === 'C' || key === 'AC') {
            return { ...prev, value: '0' };
        }
        if (key === 'Bksce') {
            return { ...prev, value: currentValue.length > 1 ? currentValue.slice(0, -1) : '0' };
        }
        if (key === '+/-') {
            if (currentValue === '0' || !currentValue) return prev;
            return { ...prev, value: currentValue.startsWith('-') ? currentValue.substring(1) : '-' + currentValue };
        }
        if (key === '.') {
            if (currentValue.includes('.')) return prev;
            return { ...prev, value: currentValue + '.' };
        }


        const newValue = (currentValue === '0' && key !== '.') ? key : currentValue + key;

        if (isNumeralSystem) {
            const selectedUnit = prev.unit;
            let regex = /.*/;
            if (selectedUnit === 'binary') regex = /^[01]*$/;
            if (selectedUnit === 'octal') regex = /^[0-7]*$/;
            if (selectedUnit === 'decimal') regex = /^[0-9]*$/;
            if (selectedUnit === 'hexadecimal') regex = /^[0-9a-fA-F]*$/i;
            if (!regex.test(newValue)) return prev;
        }

        return { ...prev, value: newValue };
    });

  }, [activeInput, handleSwap, isNumeralSystem]);

  return (
    <div className="flex flex-col h-full bg-background">
        <div className="p-2 shrink-0">
           <Select value={activeCategory} onValueChange={handleCategoryChange}>
             <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select category" />
             </SelectTrigger>
             <SelectContent>
                {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                           <category.icon className="h-5 w-5" />
                           <span>{category.name}</span>
                        </div>
                    </SelectItem>
                ))}
             </SelectContent>
           </Select>
        </div>

        <div className="flex flex-col p-2 gap-2 shrink-0">
            <DisplayPanel
                value={from.value}
                unit={from.unit}
                units={unitsForCategory}
                onUnitChange={handleFromUnitChange}
                isActive={activeInput === 'from'}
                onClick={() => setActiveInput('from')}
                onValueChange={(value) => handleValueChange(value, setFrom, () => setActiveInput('from'))}
                isNumeralSystem={isNumeralSystem}
            />
            <DisplayPanel
                value={to.value}
                unit={to.unit}
                units={unitsForCategory}
                onUnitChange={handleToUnitChange}
                isActive={activeInput === 'to'}
                onClick={() => setActiveInput('to')}
                onValueChange={(value) => handleValueChange(value, setTo, () => setActiveInput('to'))}
                isNumeralSystem={isNumeralSystem}
            />
        </div>
        <div className="flex-grow p-2">
            {isNumeralSystem ? (
                <NumeralCalculator onInput={handleCalculatorInput} activeUnit={activeInput === 'from' ? from.unit : to.unit} />
            ) : (
                <StandardCalculator onInput={handleCalculatorInput} activeCategory={activeCategory} />
            )}
        </div>
    </div>
  );
}
