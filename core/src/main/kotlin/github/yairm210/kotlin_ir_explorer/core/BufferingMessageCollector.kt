import org.jetbrains.kotlin.cli.common.messages.CompilerMessageSeverity
import org.jetbrains.kotlin.cli.common.messages.CompilerMessageSourceLocation
import org.jetbrains.kotlin.cli.common.messages.MessageCollector

/*
 * Copied DIRECTLY org.jetbrains.kotlin.cli.common.messages
 *  (As per Apache 2.0 license terms)
 * TODO: Update compiler to latest so we get can reference this directly, it's silly we need to copy it
 * 
 * Copyright 2010-2024 JetBrains s.r.o. and Kotlin Programming Language contributors.
 * Use of this source code is governed by the Apache 2.0 license that can be found in the license/LICENSE.txt file.
 */



/**
 * A message collector which collects all messages into a list and allows to access it.
 */
open class MessageCollectorImpl : MessageCollector {
    private val _messages: MutableList<Message> = mutableListOf<Message>()

    val messages: List<Message> get() = _messages

    val errors: List<Message>
        get() = messages.filter { it.severity.isError }

    fun forward(other: MessageCollector) {
        for (message in _messages) {
            other.report(message.severity, message.message, message.location)
        }
    }

    override fun clear() {
        _messages.clear()
    }

    override fun report(
        severity: CompilerMessageSeverity,
        message: String,
        location: CompilerMessageSourceLocation?,
    ) {
        _messages.add(Message(severity, message, location))
    }

    override fun hasErrors(): Boolean =
        messages.any { it.severity.isError }

    override fun toString(): String = messages.joinToString("\n")

    data class Message(val severity: CompilerMessageSeverity, val message: String, val location: CompilerMessageSourceLocation?) {
        override fun toString(): String = buildString {
            if (location != null) {
                append(location)
                append(": ")
            }
            append(severity.presentableName)
            append(": ")
            append(message)
        }
    }
}