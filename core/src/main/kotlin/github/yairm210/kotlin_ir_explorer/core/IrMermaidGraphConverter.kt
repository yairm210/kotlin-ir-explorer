package github.yairm210.kotlin_ir_explorer.core

import org.jetbrains.kotlin.ir.IrElement
import org.jetbrains.kotlin.ir.declarations.IrFunction
import org.jetbrains.kotlin.ir.declarations.IrModuleFragment
import org.jetbrains.kotlin.ir.symbols.UnsafeDuringIrConstructionAPI
import org.jetbrains.kotlin.ir.util.render
import org.jetbrains.kotlin.ir.visitors.IrElementVisitor

object IrMermaidGraphConverter {
    @OptIn(UnsafeDuringIrConstructionAPI::class)
    fun convertToMermaidGraph(irModuleFragment: IrModuleFragment): String {
        val sb = StringBuilder()
        sb.appendLine("graph TD")
        irModuleFragment.files.forEach { file ->
            file.accept(IrMermaidGraphListener(), Triple(null, sb, 0))
        }
        return sb.toString()
    }
}

class IrMermaidGraphListener:IrElementVisitor<Unit, Triple<IrElement?, StringBuilder, Int>> {
    override fun visitElement(element: IrElement, data: Triple<IrElement?, StringBuilder, Int>) {
        val (parent, stringbuilder:StringBuilder, depth) = data
        
        // Don't use stringbuilder.repeat since it's new to JVM 21
        stringbuilder.append("  ".repeat(depth))
        // Need to escape the rendered string to avoid issues with mermaid

        if (element is IrFunction) {
            stringbuilder.appendLine("subgraph ${element.name}")
        }
        
        stringbuilder.appendLine("${element.hashCode()}[\"${element.render()}\"]")
        
        // IDs of the elements are the hashcodes
        if (parent != null) {
            stringbuilder.append("  ".repeat(depth))
            stringbuilder.appendLine("${parent.hashCode()} --> ${element.hashCode()}")
        }
        // User-visible text is just the classname for now
        element.acceptChildren(this, Triple(element, stringbuilder, depth + 1))


        if (element is IrFunction) {
            stringbuilder.appendLine("end")
        }
    }
}