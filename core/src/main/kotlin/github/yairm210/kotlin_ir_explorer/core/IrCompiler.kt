import com.intellij.openapi.util.Disposer
import org.jetbrains.kotlin.backend.jvm.JvmIrCodegenFactory
import org.jetbrains.kotlin.cli.common.CLIConfigurationKeys
import org.jetbrains.kotlin.cli.common.messages.AnalyzerWithCompilerReport
import org.jetbrains.kotlin.cli.jvm.compiler.EnvironmentConfigFiles
import org.jetbrains.kotlin.cli.jvm.compiler.KotlinCoreEnvironment
import org.jetbrains.kotlin.cli.jvm.compiler.NoScopeRecordCliBindingTrace
import org.jetbrains.kotlin.cli.jvm.compiler.TopDownAnalyzerFacadeForJVM
import org.jetbrains.kotlin.cli.jvm.config.addJvmClasspathRoots
import org.jetbrains.kotlin.config.CommonConfigurationKeys
import org.jetbrains.kotlin.config.CompilerConfiguration
import org.jetbrains.kotlin.config.JVMConfigurationKeys
import org.jetbrains.kotlin.config.languageVersionSettings
import org.jetbrains.kotlin.diagnostics.DiagnosticReporterFactory
import org.jetbrains.kotlin.ir.declarations.IrModuleFragment
import org.jetbrains.kotlin.ir.symbols.UnsafeDuringIrConstructionAPI
import org.jetbrains.kotlin.ir.util.dump
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtPsiFactory
import java.io.File

// Updated for Kotlin compiler 2.1.20

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

    val rootDisposable = Disposer.newDisposable("KotlinIrExplorer")

    try {
        val environment = KotlinCoreEnvironment.createForProduction(
            rootDisposable,
            configuration,
            EnvironmentConfigFiles.JVM_CONFIG_FILES
        )

        val ktFile = KtPsiFactory(environment.project).createPhysicalFile("input.kt", kotlinCode)

        // Analyze the code using the K1 frontend
        val analysisResult = analyze(environment, listOf(ktFile))

        if (analysisResult == null || !analysisResult.shouldGenerateCode) {
            return CompilationResult(
                irModuleFragment = null,
                messages = messageCollector.messages
            )
        }

        analysisResult.throwIfError()

        // Convert to IR using JvmIrCodegenFactory
        val diagnosticsReporter = DiagnosticReporterFactory.createReporter(messageCollector)
        val codegenFactory = JvmIrCodegenFactory(configuration)

        val backendInput = codegenFactory.convertToIr(
            project = environment.project,
            files = listOf(ktFile),
            configuration = configuration,
            module = analysisResult.moduleDescriptor,
            diagnosticReporter = diagnosticsReporter,
            bindingContext = analysisResult.bindingContext,
            languageVersionSettings = configuration.languageVersionSettings,
            ignoreErrors = false,
            skipBodies = false,
        )

        return CompilationResult(
            irModuleFragment = backendInput.irModuleFragment,
            messages = messageCollector.messages
        )
    } finally {
        Disposer.dispose(rootDisposable)
    }
}

private fun analyze(
    environment: KotlinCoreEnvironment,
    sourceFiles: List<KtFile>
): org.jetbrains.kotlin.analyzer.AnalysisResult? {
    val collector = environment.configuration.getNotNull(CommonConfigurationKeys.MESSAGE_COLLECTOR_KEY)

    val analyzerWithCompilerReport = AnalyzerWithCompilerReport(
        collector,
        environment.configuration.languageVersionSettings,
        environment.configuration.getBoolean(CLIConfigurationKeys.RENDER_DIAGNOSTIC_INTERNAL_NAME)
    )

    analyzerWithCompilerReport.analyzeAndReport(sourceFiles) {
        val project = environment.project
        val sourcesOnly = TopDownAnalyzerFacadeForJVM.newModuleSearchScope(project, sourceFiles)

        @Suppress("DEPRECATION_ERROR")
        TopDownAnalyzerFacadeForJVM.analyzeFilesWithJavaIntegration(
            project,
            sourceFiles,
            NoScopeRecordCliBindingTrace(project),
            environment.configuration,
            environment::createPackagePartProvider,
            sourceModuleSearchScope = sourcesOnly,
        )
    }

    val analysisResult = analyzerWithCompilerReport.analysisResult

    return if (!analyzerWithCompilerReport.hasErrors())
        analysisResult
    else
        null
}

data class CompilationResult(
    val irModuleFragment: IrModuleFragment?,
    val messages: List<MessageCollectorImpl.Message>
)

private fun getCompilerConfiguration(messageCollector: MessageCollectorImpl): CompilerConfiguration {
    val configuration = CompilerConfiguration()
    configuration.put(CommonConfigurationKeys.MESSAGE_COLLECTOR_KEY, messageCollector)
    configuration.put(CommonConfigurationKeys.MODULE_NAME, "test-module")

    // Reference set A: The JDK. This includes fundamental things like java.io.Serializable
    // This means that the server needs to run with a JDK, and not just a JRE.
    val sdkRoot = System.getProperty("java.home")
    configuration.put(JVMConfigurationKeys.JDK_HOME, File(sdkRoot))

    // Reference set B: The classes we've included in this jar. This includes e.g. Kotlin stdlib.
    // Again we can get the classpath from running code, since this is Kotlin we're writing in :)
    val classpath = System.getProperty("java.class.path")
    val files = classpath.split(File.pathSeparatorChar).map { File(it) }
    configuration.addJvmClasspathRoots(files)
    return configuration
}
