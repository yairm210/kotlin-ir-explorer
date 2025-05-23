package github.yairm210.kotlin_ir_explorer.server

import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals

class ApplicationTest {

    @Test
    fun testRoot() = testApplication {
        application {
            // do not use module since this as built in content negotiation
            configureRouting()
        }
        client.post("/").apply {
            assertEquals(HttpStatusCode.OK, status)
        }
    }

}
