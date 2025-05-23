import React from 'react';
import { Loader2, AlertTriangle, ImageOff } from 'lucide-react';

// Function to encode Mermaid text for URL
const encodeMermaid = (mermaidText) => {
    // First, encode to Base64
    const base64 = btoa(mermaidText);
    // Then, make it URL-safe
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}; 

export default function GraphViewer({ mermaidGraphText, isProcessing, error }) {
    let content;

    if (isProcessing) { 
        content = (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-sky-400" />
                <p>Generating Diagram...</p>
                <p className="text-sm text-slate-500 mt-2">This may take a moment.</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-red-400">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="font-semibold">Error Generating Diagram</p>
                <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
        );
    } else if (!mermaidGraphText || mermaidGraphText.trim() === '' || mermaidGraphText.includes("EmptyDiagram") || mermaidGraphText.includes("Empty[")) {
        content = (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ImageOff className="h-16 w-16 mb-4 text-slate-600" />
                <h3 className="text-lg font-medium mb-2">No Diagram to Display</h3>
                <p className="text-center max-w-sm">
                    Start typing Kotlin code in the editor. The diagram will automatically update.
                </p>
                <div className="mt-4 text-sm bg-slate-700 p-3 rounded-md text-left max-w-md w-full">
                    <p className="font-medium text-slate-300">Try a simple class:</p>
                    <pre className="mt-2 overflow-x-auto text-xs bg-slate-800 p-2 rounded-md text-sky-300">
{`class Example {
  val id: Int
  fun greet(): String
}`}
            </pre>
                </div>
            </div>
        );
    } else {
        // Construct URL for mermaid.ink
        const encodedGraph = encodeMermaid(mermaidGraphText);
        const imageUrl = `https://mermaid.ink/img/${encodedGraph}?bgColor=334155`; // Using slate-800 as bg
        content = (
            <div className="p-2 flex justify-center items-center h-full w-full">
                <img
                    src={imageUrl}
                    alt="Mermaid Diagram"
                    className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                />
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-800 rounded-lg border border-slate-700 flex justify-center items-center overflow-hidden">
            {content}
        </div>
    );
}