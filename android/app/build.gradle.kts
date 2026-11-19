import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// The upload key lives outside the repository (see android/README.md); without it only debug builds work.
val keystore = Properties().apply {
    val file = rootProject.file("keystore.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

android {
    namespace = "nl.nedfa"
    compileSdk = 37

    defaultConfig {
        applicationId = "nl.nedfa"
        minSdk = 26
        targetSdk = 36
        versionCode = 5
        versionName = "1.0.4"
    }

    signingConfigs {
        if (keystore.isNotEmpty()) {
            create("upload") {
                storeFile = file(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystore.isNotEmpty()) signingConfig = signingConfigs.getByName("upload")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    // The lessons and pictures are shared with the website and the iPhone app.
    sourceSets.getByName("main").assets.directories.add(layout.buildDirectory.dir("generated/nedfa-assets").get().asFile.path)
}

/** Copies content.json (exported from ../content) and the illustrations into the app's assets. */
val nedfaAssets = tasks.register<Sync>("nedfaAssets") {
    from(rootProject.file("../ios-native/Nedfa/Resources/content.json"))
    from(rootProject.file("../src/assets/illustrations")) { into("illustrations") }
    into(layout.buildDirectory.dir("generated/nedfa-assets"))
}
tasks.named("preBuild") { dependsOn(nedfaAssets) }

dependencies {
    val bom = platform("androidx.compose:compose-bom:2026.09.00")
    implementation(bom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended:1.7.8")
    implementation("androidx.activity:activity-compose:1.13.0")
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.core:core-splashscreen:1.2.0")
    implementation("androidx.browser:browser:1.10.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.13.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.11.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
    testImplementation("junit:junit:4.13.2")
}
