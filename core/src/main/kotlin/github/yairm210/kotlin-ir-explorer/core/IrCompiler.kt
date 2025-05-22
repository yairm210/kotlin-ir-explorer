import com.intellij.openapi.util.Disposer
import org.jetbrains.kotlin.KtInMemoryTextSourceFile
import org.jetbrains.kotlin.backend.jvm.JvmIrCodegenFactory
import org.jetbrains.kotlin.cli.common.CLICompiler
import org.jetbrains.kotlin.cli.common.CLIConfigurationKeys
import org.jetbrains.kotlin.cli.common.modules.ModuleBuilder
import org.jetbrains.kotlin.cli.common.modules.ModuleChunk
import org.jetbrains.kotlin.cli.jvm.compiler.EnvironmentConfigFiles
import org.jetbrains.kotlin.cli.jvm.compiler.KotlinCoreEnvironment
import org.jetbrains.kotlin.cli.jvm.compiler.KotlinToJVMBytecodeCompiler
import org.jetbrains.kotlin.cli.jvm.compiler.pipeline.createProjectEnvironment
import org.jetbrains.kotlin.cli.jvm.config.addJvmClasspathRoots
import org.jetbrains.kotlin.config.CompilerConfiguration
import org.jetbrains.kotlin.config.JVMConfigurationKeys
import org.jetbrains.kotlin.ir.declarations.IrModuleFragment
import org.jetbrains.kotlin.ir.symbols.UnsafeDuringIrConstructionAPI
import org.jetbrains.kotlin.ir.util.dump
import org.jetbrains.kotlin.psi.KtPsiFactory
import java.io.File

// WORKS with compiler 2.0.0

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
        compilationResult.irModuleFragment.files
            .forEach { file ->
                file.declarations.forEach { declaration ->
                    println(declaration.dump())
                }
            }
    }
    
    for (message in compilationResult.messages)
        println("${message.severity}: ${message.message} ${message.location?.let { "${it.line}:${it.column}" }}")
}

fun getCompilationResult(kotlinCode: String): CompilationResult {
    // This was a pain to figure out, so if you're copying this, please attribute :D
    
    val messageCollector = MessageCollectorImpl()
    val configuration = getCompilerConfiguration(messageCollector)

    val sourceFile = KtInMemoryTextSourceFile("input.kt", "/fake/name", kotlinCode)
    
    val rootDisposable = Disposer.newDisposable("Disposable for ${CLICompiler::class.simpleName}.execImpl")
    
    val projectEnvironment =
        createProjectEnvironment(configuration, rootDisposable, EnvironmentConfigFiles.JVM_CONFIG_FILES, messageCollector)

    val ktFile = KtPsiFactory(projectEnvironment.project).createPhysicalFile(sourceFile.name, sourceFile.text.toString())
    
    val environment = KotlinCoreEnvironment.createForProduction(rootDisposable, configuration, EnvironmentConfigFiles.JVM_CONFIG_FILES)

    val module = ModuleBuilder("test-module", "", "")
    val chunk = ModuleChunk(listOf(module)).modules
    
    val result = KotlinToJVMBytecodeCompiler.runFrontendAndGenerateIrForMultiModuleChunkUsingFrontendIR(
        environment, projectEnvironment, configuration, chunk,
        listOf(ktFile)
    )
    
    return CompilationResult(
        irModuleFragment = (result?.backendInput as? JvmIrCodegenFactory.JvmIrBackendInput)?.irModuleFragment,
        messages = messageCollector.messages
    )
}

data class CompilationResult(
    val irModuleFragment: IrModuleFragment?,
    val messages: List<MessageCollectorImpl.Message>
)

private fun getCompilerConfiguration(messageCollector: MessageCollectorImpl): CompilerConfiguration {
    val configuration = CompilerConfiguration()
    configuration.put(CLIConfigurationKeys.MESSAGE_COLLECTOR_KEY, messageCollector)

    // Reference set A: The JDK. This includes fundamental things like java.io.Serializable
    // Since we're ALREADY running java we get this for free :)
    val sdkRoot = System.getProperty("java.home")
    configuration.put(JVMConfigurationKeys.JDK_HOME, File(sdkRoot))

    // Reference set B: The classes we've included in this jar. This includes e.g. Kotlin stdlib.
    // Again we can get the classpath from running code
    val classpath = System.getProperty("java.class.path")
    val files = classpath.split(':').map { File(it) }
    configuration.addJvmClasspathRoots(files)
    return configuration
}
