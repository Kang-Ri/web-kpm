'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ComboBoxOption {
    value: string;
    label: string;
    color?: string;
    category?: string;
}

interface ComboBoxProps {
    options: ComboBoxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    allowCustom?: boolean;
    className?: string;
}

export function ComboBox({
    options,
    value,
    onChange,
    placeholder = 'Select or type...',
    allowCustom = true,
    className = ''
}: ComboBoxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Update input value when prop value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (optionValue: string) => {
        setInputValue(optionValue);
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSearchTerm(newValue);

        if (allowCustom) {
            onChange(newValue);
        }

        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            {/* Input with dropdown trigger */}
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="input pr-10"
                />
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    <ChevronDown className="w-5 h-5" />
                </button>

                {/* Color indicator if option selected */}
                {selectedOption?.color && (
                    <div
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedOption.color }}
                    />
                )}
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        <div className="py-1">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${option.value === value ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    {/* Color indicator */}
                                    {option.color && (
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: option.color }}
                                        />
                                    )}

                                    {/* Label and value */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900">
                                            {option.label}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                            {option.value}
                                        </div>
                                    </div>

                                    {/* Check icon if selected */}
                                    {option.value === value && (
                                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500">
                            {allowCustom ? (
                                <div>
                                    <p className="mb-1">No templates found</p>
                                    <p className="text-xs">Type to create custom variable</p>
                                </div>
                            ) : (
                                'No options available'
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
