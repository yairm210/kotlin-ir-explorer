import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function CodeEditor({ code, onChange }) {
    const textareaRef = useRef(null);
    const preRef = useRef(null);
    const lineNumbersRef = useRef(null);

    // Function to update the highlighted view
    const updateHighlightedCode = () => {
        if (!preRef.current || !textareaRef.current || !lineNumbersRef.current) return;

        // Get the content and apply basic syntax highlighting
        const content = textareaRef.current.value;

        // Apply kotlin syntax highlighting
        const highlightedHTML = highlightKotlin(content);
        preRef.current.innerHTML = highlightedHTML;

        // Update line numbers
        const lines = content.split('\n').length;
        let lineNumbersHTML = '';
        for (let i = 1; i <= lines; i++) {
            lineNumbersHTML += `<div class="line-number">${i}</div>`;
        }
        lineNumbersRef.current.innerHTML = lineNumbersHTML;

        // Sync scroll positions
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    };

    // Highlight kotlin code
    const highlightKotlin = (code) => {
        // Keywords
        const keywords = ['fun', 'val', 'var', 'class', 'object', 'interface', 'abstract', 'override',
            'private', 'protected', 'public', 'internal', 'companion', 'import', 'package',
            'if', 'else', 'when', 'for', 'while', 'do', 'try', 'catch', 'finally', 'throw',
            'return', 'break', 'continue', 'in', 'is', 'as', 'typeof', 'true', 'false', 'null',
            'this', 'super', 'constructor', 'data', 'enum', 'sealed', 'suspend', 'by', 'init'];

        // Types
        const types = ['String', 'Int', 'Double', 'Float', 'Boolean', 'Char', 'Long', 'Short',
            'Byte', 'Any', 'Unit', 'Nothing', 'Array', 'List', 'Map', 'Set', 'Pair'];

        // Escape HTML to avoid XSS
        let result = code.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // Highlight keywords
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            result = result.replace(regex, `<span class="keyword">${keyword}</span>`);
        }

        // Highlight types
        for (const type of types) {
            const regex = new RegExp(`\\b${type}\\b`, 'g');
            result = result.replace(regex, `<span class="type">${type}</span>`);
        }

        // Highlight strings (simplified approach)
        result = result.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');

        // Highlight single-line comments
        result = result.replace(/\/\/(.*$)/gm, '<span class="comment">//$1</span>');

        // Highlight numbers
        result = result.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');

        // Highlight annotations
        result = result.replace(/@(\w+)/g, '<span class="annotation">@$1</span>');

        return result;
    };

    // Handle textarea input changes
    const handleChange = (e) => {
        onChange(e.target.value);
        updateHighlightedCode();
    };

    // Add listeners on mount
    useEffect(() => {
        if (!textareaRef.current) return;

        updateHighlightedCode();

        // Sync scroll
        const handleScroll = () => {
            if (preRef.current && lineNumbersRef.current) {
                preRef.current.scrollTop = textareaRef.current.scrollTop;
                preRef.current.scrollLeft = textareaRef.current.scrollLeft;
                lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
            }
        };

        // Handle tabs
        const handleTab = (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textareaRef.current.selectionStart;
                const end = textareaRef.current.selectionEnd;

                // Insert tab at cursor position
                const newValue = textareaRef.current.value.substring(0, start) + '    ' +
                    textareaRef.current.value.substring(end);

                textareaRef.current.value = newValue;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;

                // Trigger update to highlighted code
                onChange(newValue);
                updateHighlightedCode();
            }
        };

        // Update highlighted code when component receives new code prop
        if (code !== textareaRef.current.value) {
            textareaRef.current.value = code;
            updateHighlightedCode();
        }

        textareaRef.current.addEventListener('scroll', handleScroll);
        textareaRef.current.addEventListener('keydown', handleTab);

        return () => {
            if (textareaRef.current) {
                textareaRef.current.removeEventListener('scroll', handleScroll);
                textareaRef.current.removeEventListener('keydown', handleTab);
            }
        };
    }, [code]);

    // Example function to format code with simple indentation rules
    const formatCode = () => {
        if (!textareaRef.current) return;

        let code = textareaRef.current.value;
        let formattedCode = '';
        let indentLevel = 0;
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Decrease indent if line starts with closing brace
            if (line.startsWith('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }

            // Add indentation
            const indent = '    '.repeat(indentLevel);
            formattedCode += indent + line + '\n';

            // Increase indent if line ends with opening brace
            if (line.endsWith('{')) {
                indentLevel++;
            }
        }

        onChange(formattedCode.trim());
        updateHighlightedCode();
    };

    return (
        <div className="h-full w-full flex flex-col">
            <div className="bg-slate-900 p-2 border-b border-slate-700 flex justify-between items-center">
                <span className="text-sky-400 text-xs font-medium">Kotlin Code</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatCode}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300">
                    <Check className="h-3 w-3 mr-1" /> Format
                </Button>
            </div>

            <div className="flex-grow relative overflow-hidden">
                {/* Line Numbers */}
                <div ref={lineNumbersRef} className="line-numbers absolute left-0 top-0 bottom-0 w-12 bg-slate-900 z-10 text-right overflow-hidden pt-4 select-none text-slate-500">
                </div>

                {/* Syntax highlighted view */}
                <pre ref={preRef}
                     className="code-display absolute left-12 right-0 top-0 bottom-0 p-4 m-0 overflow-auto bg-slate-800 z-0"
                     aria-hidden="true">
        </pre>

                {/* Actual textarea for editing - transparent but on top of the highlighted code */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleChange}
                    placeholder="Enter Kotlin code here..."
                    className="absolute left-12 right-0 top-0 bottom-0 p-4 bg-transparent text-transparent caret-white border-none resize-none w-[calc(100%-3rem)] h-full focus:outline-none font-mono text-sm leading-relaxed z-20"
                    spellCheck="false"
                />
            </div>

            <style jsx>{`
        .code-display, textarea {
          white-space: pre;
          font-family: 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          tab-size: 4;
        }
        
        .line-numbers {
          font-family: 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
          padding-right: 0.5rem;
        }
        
        .line-number {
          padding-right: 0.5rem;
          height: 1.5rem;
        }
        
        .keyword { color: #ff79c6; } /* Pink */
        .type { color: #8be9fd; } /* Cyan */
        .string { color: #f1fa8c; } /* Yellow */
        .comment { color: #6272a4; } /* Purple-ish */
        .number { color: #bd93f9; } /* Purple */
        .annotation { color: #50fa7b; } /* Green */
      `}</style>
        </div>
    );
}