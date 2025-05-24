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
//            val kotlinCode = call.response ?: return@get call.respondText(
//                "Missing or malformed 'kotlin' parameter",
//                status = HttpStatusCode.BadRequest
//            )

            val compilationResult = getCompilationResult(kotlinCode)
            
            @Serializable
            class Response(
                val mermaidGraph: String?,
                val messages: List<String>
            )
            
            val mermaidGraph = if (compilationResult.irModuleFragment == null) null
                    else IrMermaidGraphConverter.convertToMermaidGraph(compilationResult.irModuleFragment!!)
            
            if (compilationResult.irModuleFragment == null) println("Result is null")
            else {
                compilationResult.irModuleFragment!!.files
                    .forEach { file ->
                        file.declarations.forEach { declaration ->
                            println(declaration.dump())
                        }
                    }
            }

            val renderedMessages = compilationResult.messages.map { "${it.severity}: ${it.message} ${it.location?.let { "${it.line}:${it.column}" }}" }
            
            val response = Response(
                mermaidGraph,
                renderedMessages
            )
            call.respond(response)
        }
        // Static plugin. Try to access `/static/index.html`
        staticResources("/", "static/dist")
    }
}
