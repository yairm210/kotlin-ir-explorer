import React, { useState, useEffect, useRef } from "react";
import CodeEditor from "./CodeEditor";
import GraphViewer from "./GraphViewer";
import { Loader2 } from "lucide-react";
import KotlinLogo from './KotlinLogo.svg';
import axios from "axios";


export default function CodeVisualizerPage() {
    // Initial example Kotlin code
    const [code, setCode] = useState(`// Example Kotlin code
fun main() {
    var x = 5
    if (x > 1 + 2) { 
        x += 1
        listOf(1, 2)
    }
}
`);

    const [mermaidGraphText, setMermaidGraphText] = useState("");
    const [compilerMessages, setCompilerMessages] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const timerRef = useRef(null);

    const processCode = async (codeToProcess) => {
        setIsProcessing(true);
        setError(null);

        try {
            // In a real implementation, you'd send `codeToProcess` to your backend
            // which would return the Mermaid graph *text representation*.
            const response = await axios.post("/api/kotlinToMermaid", codeToProcess)
            const graphText = response.data.mermaidGraph
            const messages = response.data.messages 
            setMermaidGraphText(graphText)
            setCompilerMessages(messages)
        } catch (err) {
            console.error("Error processing code:", err)
            setError("Failed to generate graph. Please ensure your backend is running or check the placeholder logic.")
        } finally {
            setIsProcessing(false)
        }
    };
    
    // Debounce of 250ms, to render the graph after the user stops typing
    useEffect(() => {
        if (code.trim() === '') {
            setMermaidGraphText('classDiagram\n  Empty["Type some Kotlin code to see the diagram"]\n  classDef default fill:#2a2a3f,stroke:#6272a4,stroke-width:1px,color:#f8f8f2');
            return
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            processCode(code);
        }, 250);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [code]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f1117] text-slate-100">
            <header className="sticky top-0 z-10 bg-[#1a1c25] border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center">
                    <div className="h-6 w-6 mr-2">
                        <img src={KotlinLogo}/>
                    </div>

                    <h1 className="text-xl font-semibold text-slate-100 mr-4">Kotlin IR Explorer</h1>
                    {isProcessing && (
                        <div className="flex items-center text-sky-400">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Processing...</span>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 border-r border-slate-800 bg-[#1a1c25]">
                    <CodeEditor code={code} onChange={handleCodeChange} />
                </div>
                <div className="w-1/2 bg-[#1a1c25] p-4 overflow-auto">
                    <GraphViewer
                        mermaidGraphText={mermaidGraphText}
                        compilerMessages={compilerMessages}
                        isProcessing={isProcessing}
                        error={error}
                    />
                </div>
            </div>
        </div>
    );
}