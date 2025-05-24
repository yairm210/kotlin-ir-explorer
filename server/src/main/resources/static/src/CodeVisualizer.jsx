import React, { useState, useEffect, useRef } from "react";
// import { CodeProject } from "@/entities/CodeProject";
import CodeEditor from "./CodeEditor";
import GraphViewer from "./GraphViewer";
import { Loader2, Save, Download, Upload, Code, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

// Mock API URL - Replace with your actual backend endpoint for generating Mermaid text
const API_URL = "https://your-backend-api.com/generate-mermaid";

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
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [projectTitle, setProjectTitle] = useState("Untitled Project");
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const loadProjects = async () => {
            // try {
            //     const userProjects = await CodeProject.list("-lastUpdated");
            //     setProjects(userProjects);
            // } catch (error) {
            //     console.error("Failed to load projects", error);
            // }
        };

        loadProjects();
    }, []);

    const processCode = async (codeToProcess) => {
        setIsProcessing(true);
        setError(null);

        try {
            // In a real implementation, you'd send `codeToProcess` to your backend
            // which would return the Mermaid graph *text representation*.
            const response = await axios.post("http://localhost:8080/api/kotlinToMermaid", codeToProcess);
            const graphText = response.data.mermaidGraph; 

            // Placeholder implementation (simulating API response):
            // await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

            // let graphText = generatePlaceholderGraph(codeToProcess);
            setMermaidGraphText(graphText);
        } catch (err) {
            console.error("Error processing code:", err);
            setError("Failed to generate graph. Please ensure your backend is running or check the placeholder logic.");
        } finally {
            setIsProcessing(false);
        }
    };

    const generatePlaceholderGraph = (codeContent) => {
        const classRegex = /class\s+(\w+)(?:\s*:\s*(\w+))?(?:\s*<[^>]*>)?\s*(?:\{|$)/g; // Added generic type support
        const interfaceRegex = /interface\s+(\w+)(?:\s*:\s*(\w+))?(?:\s*<[^>]*>)?\s*(?:\{|$)/g; // Added generic type support
        const functionRegex = /fun\s+(\w+)\s*\(.*?\)\s*(?::\s*\w+\??)?\s*(?:\{|$)/g; // Improved to capture return types and handle spaces
        const propertyRegex = /(?:val|var)\s+(\w+)\s*:\s*(\w+\??(?:<[^>]*>)?)/g; // Captures properties with types
        const enumRegex = /enum\s+class\s+(\w+)\s*(?:\{|$)/g; // Captures enum classes

        const elements = new Map(); // To store class/interface details
        const relationships = [];

        let match;

        const extractMembers = (elementName, contentBlock) => {
            const members = [];
            let memberMatch;
            while ((memberMatch = functionRegex.exec(contentBlock)) !== null) {
                members.push(`+${memberMatch[1]}()`);
            }
            functionRegex.lastIndex = 0; // Reset regex
            while ((memberMatch = propertyRegex.exec(contentBlock)) !== null) {
                members.push(`+${memberMatch[1]} : ${memberMatch[2].replace(/[<>]/g, '&lt;&gt;')}`); // Escape <> for Mermaid
            }
            propertyRegex.lastIndex = 0; // Reset regex
            return members;
        };

        const findBlockEnd = (startIndex) => {
            let openBraces = 0;
            for (let i = startIndex; i < codeContent.length; i++) {
                if (codeContent[i] === '{') {
                    openBraces++;
                } else if (codeContent[i] === '}') {
                    openBraces--;
                    if (openBraces === 0) return i;
                }
            }
            return codeContent.length -1; // Fallback
        };


        while ((match = classRegex.exec(codeContent)) !== null) {
            const className = match[1];
            const startIdx = match.index;
            const blockStartIdx = codeContent.indexOf('{', startIdx);
            const blockEndIdx = blockStartIdx !== -1 ? findBlockEnd(blockStartIdx) : startIdx + match[0].length;
            const classBlock = codeContent.substring(blockStartIdx + 1, blockEndIdx);

            elements.set(className, { type: 'CLASS', name: className, members: extractMembers(className, classBlock) });
            if (match[2]) { // Inheritance
                relationships.push(`${match[2]} <|-- ${className}`);
            }
        }
        classRegex.lastIndex = 0;


        while ((match = interfaceRegex.exec(codeContent)) !== null) {
            const interfaceName = match[1];
            const startIdx = match.index;
            const blockStartIdx = codeContent.indexOf('{', startIdx);
            const blockEndIdx = blockStartIdx !== -1 ? findBlockEnd(blockStartIdx) : startIdx + match[0].length;
            const interfaceBlock = codeContent.substring(blockStartIdx + 1, blockEndIdx);

            elements.set(interfaceName, { type: 'INTERFACE', name: interfaceName, members: extractMembers(interfaceName, interfaceBlock) });
            if (match[2]) { // Inheritance
                relationships.push(`${match[2]} <|-- ${interfaceName}`);
            }
        }
        interfaceRegex.lastIndex = 0;

        // Process enums
        while ((match = enumRegex.exec(codeContent)) !== null) {
            const enumName = match[1];
            elements.set(enumName, { type: 'ENUM', name: enumName, members: [] });
        }

        // Generate the Mermaid class diagram
        let graph = 'classDiagram\n';

        // Apply dark theme and styling options to make diagram look better on dark backgrounds
        graph += '  %% Class diagram styling\n';
        graph += '  classDef default fill:#2a2a3f,stroke:#6272a4,stroke-width:1px,color:#f8f8f2,font-family:monospace\n';
        graph += '  classDef interface fill:#1e1e2e,stroke:#9580ff,stroke-width:1px,color:#f8f8f2,font-family:monospace\n';
        graph += '  classDef enum fill:#2c233b,stroke:#b679ff,stroke-width:1px,color:#f8f8f2,font-family:monospace\n\n';

        elements.forEach(el => {
            graph += `  class ${el.name} {\n`;
            if (el.type === 'INTERFACE') {
                graph += `    <<Interface>>\n`;
            } else if (el.type === 'ENUM') {
                graph += `    <<Enum>>\n`;
            }
            el.members.forEach(member => {
                graph += `    ${member}\n`;
            });
            graph += '  }\n';

            // Add styling class
            if (el.type === 'INTERFACE') {
                graph += `  class ${el.name} :::interface\n`;
            } else if (el.type === 'ENUM') {
                graph += `  class ${el.name} :::enum\n`;
            }
        });

        relationships.forEach(rel => {
            graph += `  ${rel}\n`;
        });

        return graph || 'classDiagram\n  EmptyDiagram["No classes or interfaces found"]';
    };

    useEffect(() => {
        if (code.trim() === '') {
            setMermaidGraphText('classDiagram\n  Empty["Type some Kotlin code to see the diagram"]\n  classDef default fill:#2a2a3f,stroke:#6272a4,stroke-width:1px,color:#f8f8f2');
            return;
        }

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            processCode(code);
        }, 3000);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [code]);

    const handleCodeChange = (newCode) => {
        setCode(newCode);
    };

    const saveProject = async () => {
        setIsProcessing(true);
        try {
            // const projectData = {
            //     title: projectTitle,
            //     kotlinCode: code,
            //     mermaidGraph: mermaidGraphText, // Save the Mermaid text
            //     lastUpdated: new Date().toISOString()
            // };
            //
            // if (selectedProjectId) {
            //     await CodeProject.update(selectedProjectId, projectData);
            // } else {
            //     const newProject = await CodeProject.create(projectData);
            //     setSelectedProjectId(newProject.id); // Set ID for subsequent saves
            // }
            //
            // const userProjects = await CodeProject.list("-lastUpdated");
            // setProjects(userProjects);
            setSaveDialogOpen(false);
        } catch (error) {
            console.error("Failed to save project", error);
            setError("Failed to save project. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const loadProject = async (projectId) => {
        try {
            const project = projects.find(p => p.id === projectId);
            if (project) {
                setCode(project.kotlinCode);
                setMermaidGraphText(project.mermaidGraph); // Load Mermaid text
                setProjectTitle(project.title);
                setSelectedProjectId(project.id);
                setLoadDialogOpen(false);
            }
        } catch (error) {
            console.error("Failed to load project", error);
            setError("Failed to load project. Please try again.");
        }
    };

    const startNewProject = () => {
        setCode("");
        setMermaidGraphText("");
        setProjectTitle("Untitled Project");
        setSelectedProjectId(null);
        setError(null);
    };

    return (
        <div className="flex flex-col h-screen bg-[#0f1117] text-slate-100">
            <header className="sticky top-0 z-10 bg-[#1a1c25] border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center">
                    <Code className="text-sky-400 mr-2 h-6 w-6" />
                    <h1 className="text-xl font-semibold text-slate-100 mr-4">{projectTitle}</h1>
                    {isProcessing && (
                        <div className="flex items-center text-sky-400">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm">Processing...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={startNewProject}
                        className="bg-[#2d303e] hover:bg-[#3a3e52] text-slate-200"
                    >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        New
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLoadDialogOpen(true)}
                        className="bg-[#2d303e] hover:bg-[#3a3e52] text-slate-200"
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Load
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSaveDialogOpen(true)}
                        className="bg-sky-600 hover:bg-sky-700 text-white"
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 border-r border-slate-800 bg-[#1a1c25]">
                    <CodeEditor code={code} onChange={handleCodeChange} />
                </div>
                <div className="w-1/2 bg-[#1a1c25] p-4 overflow-auto">
                    <GraphViewer
                        mermaidGraphText={mermaidGraphText}
                        isProcessing={isProcessing}
                        error={error}
                    />
                </div>
            </div>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="bg-[#1a1c25] border-slate-700 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Save Project</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Enter a name for your Kotlin project.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Project name"
                        className="mt-2 bg-[#2d303e] border-slate-600 text-slate-100 focus:ring-sky-500"
                    />
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="bg-[#2d303e] hover:bg-[#3a3e52] border-slate-600 text-slate-200">
                            Cancel
                        </Button>
                        <Button onClick={saveProject} disabled={isProcessing} className="bg-sky-600 hover:bg-sky-700 text-white">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogContent className="bg-[#1a1c25] border-slate-700 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Load Project</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Select a project to load its Kotlin code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 my-4 p-1 rounded-md scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700">
                        {projects.length > 0 ? (
                            projects.map(project => (
                                <div
                                    key={project.id}
                                    className="p-3 border border-slate-700 rounded-md hover:bg-[#2d303e] cursor-pointer transition-colors"
                                    onClick={() => loadProject(project.id)}
                                >
                                    <div className="font-medium text-sky-400">{project.title}</div>
                                    <div className="text-xs text-slate-400 mt-1">
                                        Last updated: {new Date(project.lastUpdated).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-slate-500 py-4">
                                No saved projects found.
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setLoadDialogOpen(false)} className="bg-[#2d303e] hover:bg-[#3a3e52] border-slate-600 text-slate-200">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}