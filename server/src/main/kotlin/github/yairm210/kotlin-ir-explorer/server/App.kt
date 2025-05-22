package github.yairm210.`kotlin-ir-explorer`.server

import getCompilationResult
import github.yairm210.`kotlin-ir-explorer`.core.IrMermaidGraphConverter
import org.jetbrains.kotlin.ir.symbols.UnsafeDuringIrConstructionAPI
import org.jetbrains.kotlin.ir.util.dump

@OptIn(UnsafeDuringIrConstructionAPI::class)
fun main() {

    val kotlinCode = """
        fun main() {
            var x = 5
            if (x > 1 + 2) {
                x += 1
                listOf(1, 2)
            }
        }
    """.trimIndent()

    val compilationResult = getCompilationResult(kotlinCode)

    if (compilationResult.irModuleFragment == null) println("Result is null")
    else {
        compilationResult.irModuleFragment!!.files
            .forEach { file ->
                file.declarations.forEach { declaration ->
                    println(declaration.dump())
                }
            }
        val mermaidGraph = IrMermaidGraphConverter.convertToMermaidGraph(compilationResult.irModuleFragment!!)
        println(mermaidGraph)
    }

    for (message in compilationResult.messages)
        println("${message.severity}: ${message.message} ${message.location?.let { "${it.line}:${it.column}" }}")
}
