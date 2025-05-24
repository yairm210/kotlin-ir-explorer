import React, {use, useEffect, useRef, useState} from 'react';
import { Loader2, AlertTriangle, ImageOff } from 'lucide-react';
import mermaid from 'mermaid';

mermaid.initialize(
    {
        startOnLoad: false, // We will render manually
        theme: 'dark',      // Apply dark theme globally
        // Dark theme configuration similar to Dracula
        themeVariables: {
            background: '#0f1117',
            primaryColor: '#1a1c25', // Node background
            primaryTextColor: '#f8f8f2',
            primaryBorderColor: '#6272a4',
            // lineColor: '#44475a',
            secondaryColor: '#2d303e',
            tertiaryColor: '#2d303e',
            fontSize: '14px',
            fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, Courier New, monospace',

            // Specific for class diagrams
            classText: '#f8f8f2',
        },
        securityLevel: 'loose', // Allow clicks etc
    }
)

function Mermaid({ graphText }) {
    useEffect(()=> { // Applies after loading
        mermaid.run() // There may be a nicer way to wrap this
    }, []);
    return <div className="mermaid h-full w-full flex">{graphText}</div>;
}

export default function GraphViewer({ mermaidGraphText, isProcessing, error }) {
    const containerRef = useRef(null);
    const [rendering, setRendering] = useState(false);
    const [renderError, setRenderError] = useState(null);

    // Render graph when text or library readiness changes
    useEffect(() => {
        if (!mermaidGraphText || !containerRef.current || isProcessing) {
            if (!mermaidGraphText && containerRef.current) {
                containerRef.current.innerHTML = ''; // Clear if no text
            }
            return;
        }

        setRendering(true);
        setRenderError(null);
        const graphId = `mermaid-graph-${Date.now()}`;

        try {
            // mermaid.render() returns a promise with the SVG
            mermaid.render(graphId, mermaidGraphText)
                .then(({ svg, bindFunctions }) => {
                    if (containerRef.current) {
                        containerRef.current.innerHTML = svg;
                        if (bindFunctions) {
                            bindFunctions(containerRef.current); // For interactivity if any
                        }
                    }
                    setRendering(false);
                })
                .catch(err => {
                    console.error("Mermaid rendering error:", err);
                    setRenderError(`Diagram error: ${err.message || 'Could not render graph.'}`);
                    if (containerRef.current) {
                        containerRef.current.innerHTML = `<div class="text-red-400 p-4">Error rendering diagram. Check console.</div>`;
                    }
                    setRendering(false);
                });
        } catch (err) {
            console.error("Synchronous Mermaid error:", err);
            setRenderError(`Diagram error: ${err.message || 'Critical error.'}`);
            if (containerRef.current) {
                containerRef.current.innerHTML = `<div class="text-red-400 p-4">Critical diagram rendering error.</div>`;
            }
            setRendering(false);
        }

    }, [mermaidGraphText, isProcessing]);


    let content;

    if (isProcessing || rendering) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-sky-400" />
                <p>{isProcessing ? "Processing Code..." : "Rendering Diagram..."}</p>
            </div>
        );
    } else if (error || renderError) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-red-400">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="font-semibold">Error</p>
                <p className="text-sm text-red-500 mt-1">{error || renderError}</p>
            </div>
        );
    } else if (!mermaidGraphText || mermaidGraphText.trim() === '') {
        // This condition checks for specific placeholder texts in the mermaid string
        content = (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ImageOff className="h-16 w-16 mb-4 text-slate-500" />
                <h3 className="text-lg font-medium mb-2">No Diagram to Display</h3>
                <p className="text-center max-w-sm">
                    Start typing Kotlin code in the editor. The diagram will automatically update.
                </p>
                <div className="mt-4 text-sm bg-[#2d303e] p-3 rounded-md text-left max-w-md w-full">
                    <p className="font-medium text-slate-300">Try a simple class:</p>
                    <pre className="mt-2 overflow-x-auto text-xs bg-[#0f1117] p-2 rounded-md text-sky-300">
{`class Example {
  val id: Int
  fun greet(): String
}`}
            </pre>
                </div>
            </div>
        );
    } else {
        // The div will be populated by the useEffect hook
        content = (
            <div ref={containerRef} className="w-full h-full flex justify-center items-center overflow-auto p-2 mermaid-live-container">
                <Mermaid graphText={mermaidGraphText} />
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-[#0f1117] rounded-lg border border-slate-800 flex justify-center items-center overflow-hidden">
            {content}
        </div>
    );
}