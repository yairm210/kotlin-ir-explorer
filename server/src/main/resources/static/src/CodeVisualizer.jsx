
import React, { useState, useEffect, useRef } from "react";
// import { CodeProject } from "@/entities/CodeProject";
// import { User } from "@/entities/User"; // User not explicitly used yet, can be added later if needed
import CodeEditor from "../src/CodeEditor.jsx";
import GraphViewer from "../src/GraphViewer.jsx";
// No direct mermaid import needed here anymore
// import axios from 'axios'; // Not used in current placeholder
import { Loader2, Save, Download, Upload } from "lucide-react";
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

// Mock API URL - Replace with your actual backend endpoint for generating Mermaid text
// const API_URL = "https://your-backend-api.com/generate-mermaid";

export default function CodeVisualizerPage() {
    const [code, setCode] = useState(`// Example Kotlin code
fun main() {
    val greeting = "Hello, Kotlin!"
    println(greeting)
    
    val person = Person("John", 30)
    println(person.introduce())
}

class Person(private val name: String, private val age: Int) {
    fun introduce(): String {
        return "I'm $name, $age years old."
    }
    
    fun celebrate() {
        println("$name is celebrating their birthday!")
    }
}`);
    const [mermaidGraphText, setMermaidGraphText] = useState(""); // Store Mermaid text
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
            // e.g., const response = await axios.post(API_URL, { code: codeToProcess });
            // const graphText = response.data.mermaidText; 

            // Placeholder implementation (simulating API response):
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

            let graphText = generatePlaceholderGraph(codeToProcess);
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
                members.push(`+${memberMatch[1]} : ${memberMatch[2].replace(/[<>]/g, '#lt;/#gt;')}`); // Escape <> for Mermaid
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

        let graph = 'classDiagram\n';
        elements.forEach(el => {
            graph += `  class ${el.name} {\n`;
            if (el.type === 'INTERFACE') {
                graph += `    <<Interface>>\n`;
            }
            el.members.forEach(member => {
                graph += `    ${el.name} : ${member}\n`;
            });
            graph += `  }\n`;
        });

        relationships.forEach(rel => {
            graph += `  ${rel}\n`;
        });

        return graph || 'classDiagram\n  EmptyDiagram["No classes or interfaces found"]';
    };

    useEffect(() => {
        if (code.trim() === '') {
            setMermaidGraphText('classDiagram\n  Empty["Type some Kotlin code to see the diagram"]');
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
            // setSaveDialogOpen(false);
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
        <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
            <header className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between shadow-md">
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400 mr-2"><path d="M10 20.5c.7-.1 1.4-.3 2-.5l8-4.4c.5-.2.8-.8.8-1.3v-3.8c0-.6-.3-1.1-.8-1.3l-8-4.4c-.7-.3-1.3-.3-2-.1C9.3 5.2 8.7 5 8 5c-1.7 0-3 1.3-3 3v8c0 1.7 1.3 3 3 3 .7 0 1.3-.2 1.8-.5H10Z"/><path d="M10 5.5c.7.1 1.4.3 2 .5l8 4.4c.5.2.8.8.8 1.3v3.8c0 .6-.3-1.1-.8-1.3l-8 4.4c-.7.3-1.3.3-2 .1.5.3 1.1.5 1.8.5 1.7 0 3-1.3 3-3v-8c0-1.7-1.3-3-3-3-.7 0-1.3.2-1.8.5H10Z"/></svg>
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
                        variant="outline"
                        size="sm"
                        onClick={startNewProject}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                    >
                        New
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoadDialogOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Load
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSaveDialogOpen(true)}
                        className="bg-sky-500 hover:bg-sky-600 text-white"
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Save
                    </Button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 border-r border-slate-700 bg-slate-800 shadow-lg">
                    <CodeEditor code={code} onChange={handleCodeChange} />
                </div>
                <div className="w-1/2 bg-slate-800 p-4 overflow-auto shadow-lg">
                    <GraphViewer
                        mermaidGraphText={mermaidGraphText}
                        isProcessing={isProcessing}
                        error={error}
                    />
                </div>
            </div>

            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
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
                        className="mt-2 bg-slate-700 border-slate-600 text-slate-100 focus:ring-sky-500"
                    />
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200">
                            Cancel
                        </Button>
                        <Button onClick={saveProject} disabled={isProcessing} className="bg-sky-500 hover:bg-sky-600 text-white">
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Save Project
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
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
                                    className="p-3 border border-slate-700 rounded-md hover:bg-slate-700 cursor-pointer transition-colors"
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
                        <Button variant="outline" onClick={() => setLoadDialogOpen(false)} className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200">
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
