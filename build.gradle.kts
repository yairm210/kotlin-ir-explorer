

repositories {
    mavenCentral()
    gradlePluginPortal()
}


plugins {
    kotlin("jvm") version "2.1.20"
    `kotlin-dsl`
}

subprojects {
    apply(plugin = "kotlin")

    repositories {
        
        mavenCentral()
    }

    dependencies {

        "implementation"("org.jetbrains.kotlin:kotlin-compiler:2.1.20")

        "testImplementation"("org.junit.jupiter:junit-jupiter:5.12.1")

        "testRuntimeOnly"("org.junit.platform:junit-platform-launcher")
    }
    
}
