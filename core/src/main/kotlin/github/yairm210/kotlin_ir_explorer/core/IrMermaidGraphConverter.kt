package github.yairm210.kotlin_ir_explorer.core

import org.jetbrains.kotlin.ir.IrElement
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
            file.declarations.forEach { declaration ->
                sb.append("subgraph ${declaration.startOffset}-${declaration.endOffset}\n")
                declaration.accept(IrMermaidGraphListener(), Triple(null, sb, 0))
                sb.append("end")
            }
        }
        return sb.toString()
    }
}

class IrMermaidGraphListener:IrElementVisitor<Unit, Triple<IrElement?, StringBuilder, Int>> {
    override fun visitElement(element: IrElement, data: Triple<IrElement?, StringBuilder, Int>) {
        val (parent, stringbuilder, depth) = data
        
        stringbuilder.repeat("  ", depth)
        // Need to escape the rendered string to avoid issues with mermaid
        stringbuilder.appendLine("${element.hashCode()}[\"${element.render()}\"]")
        
        // IDs of the elements are the hashcodes
        if (parent != null) {
            stringbuilder.repeat("  ", depth)
            stringbuilder.appendLine("${parent.hashCode()} --> ${element.hashCode()}")
        }
        // User-visible text is just the classname for now
        element.acceptChildren(this, Triple(element, stringbuilder, depth + 1))
    }
}