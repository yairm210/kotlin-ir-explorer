import React, { useEffect, useRef, useState } from 'react';

export default function CodeEditor({ code, onChange }) {
    const containerRef = useRef(null);
    const [editor, setEditor] = useState(null);
    const [monacoLoaded, setMonacoLoaded] = useState(false);
    const [initializing, setInitializing] = useState(true);

    // Load Monaco Editor script
    useEffect(() => {
        if (window.monaco) {
            setMonacoLoaded(true);
            return;
        }

        // Create a script element for Monaco loader
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/loader.js';
        script.async = true;
        script.onload = () => {
            // Configure require path
            window.require.config({
                paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' }
            });

            // Need to explicitly tell Monaco to use the VS Code dark theme
            window.require.config({ 'vs/nls': { availableLanguages: { '*': 'en' } } });

            // Load Monaco modules
            window.require(['vs/editor/editor.main'], () => {
                setMonacoLoaded(true);
            });
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Create and configure editor once Monaco is loaded
    useEffect(() => {
        if (!monacoLoaded || !containerRef.current) return;

        // Define Kotlin language
        if (!window.monaco.languages.getLanguages().some(({ id }) => id === 'kotlin')) {
            // Register the language
            window.monaco.languages.register({ id: 'kotlin' });

            // Define syntax highlighting tokens
            window.monaco.languages.setMonarchTokensProvider('kotlin', {
                tokenizer: {
                    root: [
                        [/\b(package|import|class|interface|object|fun|val|var|when|if|else|for|while|return|constructor|companion|data|sealed|enum|override|open|private|protected|public|internal|final|abstract|suspend|lateinit|inline|get|set|this|super)\b/, 'keyword'],
                        [/\b(Int|String|Boolean|Float|Double|Long|Short|Byte|Any|Unit|Nothing)\b/, 'type'],
                        [/\/\/.*$/, 'comment'],
                        [/\/\*/, 'comment', '@comment'],
                        [/"/, 'string', '@string_double'],
                        [/'[^']*'/, 'string'],
                        [/\d+/, 'number'],
                        [/@\w+/, 'annotation'],
                    ],
                    comment: [
                        [/[^/*]+/, 'comment'],
                        [/\/\*/, 'comment', '@push'],
                        [/\*\//, 'comment', '@pop'],
                        [/[/*]/, 'comment']
                    ],
                    string_double: [
                        [/[^\\"]+/, 'string'],
                        [/\\./, 'string.escape'],
                        [/"/, 'string', '@pop']
                    ]
                }
            });
        }

        // Define a dark dracula-inspired theme
        window.monaco.editor.defineTheme('kotlinDarkDracula', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6272a4' },
                { token: 'keyword', foreground: 'ff79c6', fontStyle: 'bold' },
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'number', foreground: 'bd93f9' },
                { token: 'type', foreground: '8be9fd' },
                { token: 'annotation', foreground: '50fa7b' },
            ],
            colors: {
                'editor.background': '#1a1c25',
                'editor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#2d303e',
                'editor.selectionBackground': '#44475a',
                'editorCursor.foreground': '#f8f8f2',
                'editorWhitespace.foreground': '#3B3A32',
                'editorIndentGuide.activeBackground': '#9D550FB0',
                'editor.selectionHighlightBorder': '#222218'
            }
        });

        // Set the default theme explicitly to dark before creating the editor
        window.monaco.editor.setTheme('kotlinDarkDracula');

        // Initialize Monaco editor with the custom theme
        const editorInstance = window.monaco.editor.create(containerRef.current, {
            value: code,
            language: 'kotlin',
            theme: 'kotlinDarkDracula',
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace",
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            scrollbar: {
                useShadows: true,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            },
            padding: { top: 16 },
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always'
        });

        // Add event listener for content changes
        const disposable = editorInstance.onDidChangeModelContent(() => {
            onChange(editorInstance.getValue());
        });

        setEditor(editorInstance);
        setInitializing(false);

        // Clean up
        return () => {
            disposable.dispose();
            editorInstance.dispose();
        };
    }, [monacoLoaded, containerRef]);

    // Update editor value when code prop changes
    useEffect(() => {
        if (editor && code !== editor.getValue()) {
            editor.setValue(code);
        }
    }, [code, editor]);

    return (
        <div className="h-full w-full flex flex-col overflow-hidden">
            {initializing && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1c25] z-10">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400 mx-auto"></div>
                        <p className="mt-4 text-slate-300">Loading editor...</p>
                    </div>
                </div>
            )}
            <div
                ref={containerRef}
                className="h-full w-full overflow-hidden flex-grow"
                style={{
                    backgroundColor: '#1a1c25',
                    border: 'none',
                    outline: 'none'
                }}
            />
        </div>
    );
}