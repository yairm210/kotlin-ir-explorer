package github.yairm210.kotlin_ir_explorer.server

import getCompilationResult
import github.yairm210.kotlin_ir_explorer.core.IrMermaidGraphConverter
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.cors.routing.CORS

import kotlinx.serialization.Serializable
import org.jetbrains.kotlin.ir.symbols.UnsafeDuringIrConstructionAPI
import org.jetbrains.kotlin.ir.util.dump


fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {
    configureRouting()
    install(CORS){
        anyHost()
    }

    install(ContentNegotiation) {
        json()
    }
}


@OptIn(UnsafeDuringIrConstructionAPI::class)
fun Application.configureRouting() {
    routing {
        get("/api/isalive") {
            call.respondText("OK")
        }
        post("/api/kotlinToMermaid") {
            // get body as code
            
            val kotlinCode = call.receiveText()

            val compilationResult = getCompilationResult(kotlinCode)
            val withOffsetCommentParam = call.request.queryParameters["withOffsetComment"]
            val withOffsetComment = withOffsetCommentParam != null && withOffsetCommentParam.lowercase() == "true"


            @Serializable
            class CompilerMessageLocation(
                val line: Int,
                val column: Int
            )
            
            @Serializable
            class CompilerMessage(
                val severity: String,
                val message: String,
                val location: CompilerMessageLocation?
            )
            
            @Serializable
            class Response(
                val mermaidGraph: String?,
                val messages: List<CompilerMessage>
            )
            
            val mermaidGraph = if (compilationResult.irModuleFragment == null) null
                    else IrMermaidGraphConverter.convertToMermaidGraph(compilationResult.irModuleFragment!!, withOffsetComment)
            
            if (compilationResult.irModuleFragment == null) println("Result is null")
            else {
                compilationResult.irModuleFragment!!.files
                    .forEach { file ->
                        file.declarations.forEach { declaration ->
                            println(declaration.dump())
                        }
                    }
            }

            val renderedMessages = compilationResult.messages
                .filter { it.severity.isError || it.severity.isWarning }
                // Not relevant for the user
                .filterNot { it.message.contains("Classpath entry points to a non-existent location") }
                .map {
                    CompilerMessage(
                        severity = it.severity.presentableName,
                        message = it.message,
                        location = it.location?.let { loc ->
                            CompilerMessageLocation(loc.line, loc.column)
                        }
                    )
                }
            
            val response = Response(
                mermaidGraph,
                renderedMessages
            )
            call.respond(response)
        }
        staticResources("/", "static/dist")
    }
}
