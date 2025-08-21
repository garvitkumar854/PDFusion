
import { Ruler, Scale, Thermometer, Beaker, Gauge, LandPlot } from "lucide-react";
import React from 'react';

export type Unit = {
    id: string;
    name: string;
    symbol: string;
    toBase: (value: number) => number;
    fromBase: (value: number) => number;
};

export type Category = {
    id: 'length' | 'mass' | 'temperature' | 'volume' | 'speed' | 'area';
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    baseUnit: string;
    units: Unit[];
};

export const categories: Category[] = [
    {
        id: 'length',
        name: 'Length',
        icon: Ruler,
        baseUnit: 'meters',
        units: [
            { id: 'meters', name: 'Meters', symbol: 'm', toBase: v => v, fromBase: v => v },
            { id: 'kilometers', name: 'Kilometers', symbol: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
            { id: 'centimeters', name: 'Centimeters', symbol: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
            { id: 'millimeters', name: 'Millimeters', symbol: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
            { id: 'miles', name: 'Miles', symbol: 'mi', toBase: v => v * 1609.34, fromBase: v => v / 1609.34 },
            { id: 'yards', name: 'Yards', symbol: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
            { id: 'feet', name: 'Feet', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
            { id: 'inches', name: 'Inches', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
        ]
    },
    {
        id: 'mass',
        name: 'Mass',
        icon: Scale,
        baseUnit: 'kilograms',
        units: [
            { id: 'kilograms', name: 'Kilograms', symbol: 'kg', toBase: v => v, fromBase: v => v },
            { id: 'grams', name: 'Grams', symbol: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
            { id: 'milligrams', name: 'Milligrams', symbol: 'mg', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
            { id: 'pounds', name: 'Pounds', symbol: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
            { id: 'ounces', name: 'Ounces', symbol: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
            { id: 'tonnes', name: 'Tonnes', symbol: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
        ]
    },
    {
        id: 'temperature',
        name: 'Temperature',
        icon: Thermometer,
        baseUnit: 'celsius',
        units: [
            { id: 'celsius', name: 'Celsius', symbol: '°C', toBase: v => v, fromBase: v => v },
            { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F', toBase: v => (v - 32) * 5 / 9, fromBase: v => (v * 9 / 5) + 32 },
            { id: 'kelvin', name: 'Kelvin', symbol: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
        ]
    },
    {
        id: 'volume',
        name: 'Volume',
        icon: Beaker,
        baseUnit: 'liters',
        units: [
            { id: 'liters', name: 'Liters', symbol: 'L', toBase: v => v, fromBase: v => v },
            { id: 'milliliters', name: 'Milliliters', symbol: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
            { id: 'gallons-us', name: 'Gallons (US)', symbol: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
            { id: 'quarts-us', name: 'Quarts (US)', symbol: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
            { id: 'pints-us', name: 'Pints (US)', symbol: 'pt', toBase: v => v * 0.473176, fromBase: v => v / 0.473176 },
            { id: 'cups-us', name: 'Cups (US)', symbol: 'cup', toBase: v => v * 0.24, fromBase: v => v / 0.24 },
        ]
    },
    {
        id: 'speed',
        name: 'Speed',
        icon: Gauge,
        baseUnit: 'kph',
        units: [
            { id: 'kph', name: 'Kilometers/hour', symbol: 'km/h', toBase: v => v, fromBase: v => v },
            { id: 'mph', name: 'Miles/hour', symbol: 'mph', toBase: v => v * 1.60934, fromBase: v => v / 1.60934 },
            { id: 'mps', name: 'Meters/second', symbol: 'm/s', toBase: v => v * 3.6, fromBase: v => v / 3.6 },
            { id: 'knots', name: 'Knots', symbol: 'kn', toBase: v => v * 1.852, fromBase: v => v / 1.852 },
        ]
    },
     {
        id: 'area',
        name: 'Area',
        icon: LandPlot,
        baseUnit: 'sq-meters',
        units: [
            { id: 'sq-meters', name: 'Square Meters', symbol: 'm²', toBase: v => v, fromBase: v => v },
            { id: 'sq-kilometers', name: 'Square Kilometers', symbol: 'km²', toBase: v => v * 1e6, fromBase: v => v / 1e6 },
            { id: 'sq-miles', name: 'Square Miles', symbol: 'mi²', toBase: v => v * 2.59e6, fromBase: v => v / 2.59e6 },
            { id: 'sq-yards', name: 'Square Yards', symbol: 'yd²', toBase: v => v * 0.836127, fromBase: v => v / 0.836127 },
            { id: 'sq-feet', name: 'Square Feet', symbol: 'ft²', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
            { id: 'acres', name: 'Acres', symbol: 'ac', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
            { id: 'hectares', name: 'Hectares', symbol: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
        ]
    }
];

export function convert(category: Category['id'], value: number, fromUnitId: string, toUnitId: string): number {
    const cat = categories.find(c => c.id === category);
    if (!cat) throw new Error('Invalid category');

    const fromUnit = cat.units.find(u => u.id === fromUnitId);
    const toUnit = cat.units.find(u => u.id === toUnitId);
    if (!fromUnit || !toUnit) throw new Error('Invalid unit');

    const valueInBase = fromUnit.toBase(value);
    const valueInTarget = toUnit.fromBase(valueInBase);

    return valueInTarget;
}

export function formatNumber(value: number): string {
    if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-4 && value !== 0)) {
        return value.toExponential(4);
    }
    const fixed = value.toFixed(8);
    // Remove trailing zeros, but not if it's just '0.00000000'
    const trimmed = parseFloat(fixed).toString();
    
    // Check if the number is very small and became 0 after parseFloat
    if (value !== 0 && parseFloat(trimmed) === 0) {
        return fixed.replace(/0+$/, ''); // keep some precision
    }
    
    return trimmed;
}
