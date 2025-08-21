
import { Ruler, Scale, Thermometer, Beaker, Gauge, LandPlot, Clock } from "lucide-react";
import React from 'react';

export type Unit = {
    id: string;
    name: string;
    symbol: string;
    toBase: (value: number) => number;
    fromBase: (value: number) => number;
};

export type Category = {
    id: 'length' | 'mass' | 'temperature' | 'volume' | 'speed' | 'area' | 'time';
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
            { id: 'micrometers', name: 'Micrometers', symbol: 'μm', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
            { id: 'nanometers', name: 'Nanometers', symbol: 'nm', toBase: v => v / 1e9, fromBase: v => v * 1e9 },
            { id: 'miles', name: 'Miles', symbol: 'mi', toBase: v => v * 1609.34, fromBase: v => v / 1609.34 },
            { id: 'yards', name: 'Yards', symbol: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
            { id: 'feet', name: 'Feet', symbol: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
            { id: 'inches', name: 'Inches', symbol: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
            { id: 'nautical-miles', name: 'Nautical Miles', symbol: 'nmi', toBase: v => v * 1852, fromBase: v => v / 1852 },
            { id: 'furlongs', name: 'Furlongs', symbol: 'fur', toBase: v => v * 201.168, fromBase: v => v / 201.168 },
            { id: 'fathoms', name: 'Fathoms', symbol: 'fath', toBase: v => v * 1.8288, fromBase: v => v / 1.8288 },
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
            { id: 'tonnes', name: 'Metric Tons', symbol: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
            { id: 'pounds', name: 'Pounds', symbol: 'lb', toBase: v => v * 0.45359237, fromBase: v => v / 0.45359237 },
            { id: 'ounces', name: 'Ounces', symbol: 'oz', toBase: v => v * 0.0283495231, fromBase: v => v / 0.0283495231 },
            { id: 'carats', name: 'Carats', symbol: 'ct', toBase: v => v / 5000, fromBase: v => v * 5000 },
            { id: 'stone', name: 'Stone', symbol: 'st', toBase: v => v * 6.35029318, fromBase: v => v / 6.35029318 },
            { id: 'troy-ounce', name: 'Troy Ounces', symbol: 'oz t', toBase: v => v * 0.0311034768, fromBase: v => v / 0.0311034768 },
            { id: 'slugs', name: 'Slugs', symbol: 'slug', toBase: v => v * 14.59390, fromBase: v => v / 14.59390 },
            { id: 'drams', name: 'Drams', symbol: 'dr', toBase: v => v * 0.0017718452, fromBase: v => v / 0.0017718452 },
            { id: 'grains', name: 'Grains', symbol: 'gr', toBase: v => v * 0.00006479891, fromBase: v => v / 0.00006479891 },
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
        id: 'time',
        name: 'Time',
        icon: Clock,
        baseUnit: 'seconds',
        units: [
            { id: 'seconds', name: 'Seconds', symbol: 's', toBase: v => v, fromBase: v => v },
            { id: 'nanoseconds', name: 'Nanoseconds', symbol: 'ns', toBase: v => v / 1e9, fromBase: v => v * 1e9 },
            { id: 'milliseconds', name: 'Milliseconds', symbol: 'ms', toBase: v => v / 1000, fromBase: v => v * 1000 },
            { id: 'minutes', name: 'Minutes', symbol: 'min', toBase: v => v * 60, fromBase: v => v / 60 },
            { id: 'hours', name: 'Hours', symbol: 'h', toBase: v => v * 3600, fromBase: v => v / 3600 },
            { id: 'days', name: 'Days', symbol: 'd', toBase: v => v * 86400, fromBase: v => v / 86400 },
            { id: 'weeks', name: 'Weeks', symbol: 'wk', toBase: v => v * 604800, fromBase: v => v / 604800 },
            { id: 'months', name: 'Months', symbol: 'mo', toBase: v => v * 2.628e+6, fromBase: v => v / 2.628e+6 },
            { id: 'years', name: 'Years', symbol: 'yr', toBase: v => v * 3.154e+7, fromBase: v => v / 3.154e+7 },
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
            { id: 'cubic-meters', name: 'Cubic Meters', symbol: 'm³', toBase: v => v * 1000, fromBase: v => v / 1000 },
            { id: 'gallons-us', name: 'Gallons (US)', symbol: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
            { id: 'quarts-us', name: 'Quarts (US)', symbol: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
            { id: 'pints-us', name: 'Pints (US)', symbol: 'pt', toBase: v => v * 0.473176, fromBase: v => v / 0.473176 },
            { id: 'cups-us', name: 'Cups (US)', symbol: 'cup', toBase: v => v * 0.24, fromBase: v => v / 0.24 },
            { id: 'gallons-imp', name: 'Gallons (Imp.)', symbol: 'gal imp', toBase: v => v * 4.54609, fromBase: v => v / 4.54609 },
            { id: 'pints-imp', name: 'Pints (Imp.)', symbol: 'pt imp', toBase: v => v * 0.568261, fromBase: v => v / 0.568261 },
            { id: 'cubic-feet', name: 'Cubic Feet', symbol: 'ft³', toBase: v => v * 28.3168, fromBase: v => v / 28.3168 },
        ]
    },
    {
        id: 'speed',
        name: 'Speed',
        icon: Gauge,
        baseUnit: 'kph',
        units: [
            { id: 'kph', name: 'Kilometers/hour', symbol: 'km/h', toBase: v => v, fromBase: v => v },
            { id: 'miles-per-hour', name: 'Miles/hour', symbol: 'mph', toBase: v => v * 1.60934, fromBase: v => v / 1.60934 },
            { id: 'mps', name: 'Meters/second', symbol: 'm/s', toBase: v => v * 3.6, fromBase: v => v / 3.6 },
            { id: 'fps', name: 'Feet/second', symbol: 'ft/s', toBase: v => v * 1.09728, fromBase: v => v / 1.09728 },
            { id: 'knots', name: 'Knots', symbol: 'kn', toBase: v => v * 1.852, fromBase: v => v / 1.852 },
            { id: 'mach', name: 'Mach', symbol: 'M', toBase: v => v * 1234.8, fromBase: v => v / 1234.8 },
            { id: 'light-speed', name: 'Speed of Light', symbol: 'c', toBase: v => v * 1.079e9, fromBase: v => v / 1.079e9 },
            { id: 'miles-per-sec', name: 'Miles/second', symbol: 'mi/s', toBase: v => v * 5793.6384, fromBase: v => v / 5793.6384 },
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
            { id: 'sq-inches', name: 'Square Inches', symbol: 'in²', toBase: v => v * 0.00064516, fromBase: v => v / 0.00064516 },
            { id: 'sq-cm', name: 'Square Centimeters', symbol: 'cm²', toBase: v => v / 10000, fromBase: v => v * 10000 },
            { id: 'hectares', name: 'Hectares', symbol: 'ha', toBase: v => v * 10000, fromBase: v => v / 10000 },
            { id: 'acres', name: 'Acres', symbol: 'ac', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
            { id: 'ares', name: 'Ares', symbol: 'a', toBase: v => v * 100, fromBase: v => v / 100 },
        ]
    }
];

type CategoryMap = {
    [K in Category['id']]: Omit<Category, 'id' | 'units'> & { units: { [unitId: string]: Unit } }
};

const categoriesMap = categories.reduce((acc, category) => {
    const unitsMap = category.units.reduce((unitAcc, unit) => {
        unitAcc[unit.id] = unit;
        return unitAcc;
    }, {} as { [unitId: string]: Unit });

    acc[category.id] = { ...category, units: unitsMap };
    return acc;
}, {} as CategoryMap);


export function convert(category: Category['id'], value: number, fromUnitId: string, toUnitId: string): number {
    const cat = categoriesMap[category];
    if (!cat) throw new Error('Invalid category');

    const fromUnit = cat.units[fromUnitId];
    const toUnit = cat.units[toUnitId];
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
