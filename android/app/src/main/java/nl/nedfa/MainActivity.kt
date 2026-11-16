package nl.nedfa

import android.app.Application
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.SportsEsports
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import nl.nedfa.data.Card
import nl.nedfa.data.Content
import nl.nedfa.data.Irregular
import nl.nedfa.data.LearningPath
import nl.nedfa.data.Learner
import nl.nedfa.data.Planner
import nl.nedfa.data.Preferences
import nl.nedfa.data.Theme
import nl.nedfa.service.Analytics
import nl.nedfa.service.Audio
import nl.nedfa.service.Cloud
import nl.nedfa.service.ContentUpdater
import nl.nedfa.ui.C
import nl.nedfa.ui.GameFlow
import nl.nedfa.ui.GameId
import nl.nedfa.ui.Haptics
import nl.nedfa.ui.IkScreen
import nl.nedfa.ui.IrregularOverviewScreen
import nl.nedfa.ui.IrregularSetScreen
import nl.nedfa.ui.LerenScreen
import nl.nedfa.ui.LevelTestSheet
import nl.nedfa.ui.PatternDetailScreen
import nl.nedfa.ui.ResourceDetailScreen
import nl.nedfa.ui.ResourcesScreen
import nl.nedfa.ui.RoundScreen
import nl.nedfa.ui.SettingsScreen
import nl.nedfa.ui.SignInSheet
import nl.nedfa.ui.SpellenScreen
import nl.nedfa.ui.ThemeDetailScreen
import nl.nedfa.ui.VandaagScreen
import nl.nedfa.ui.WelcomeScreen

class NedfaApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Content.load(this)
        Preferences.init(this)
        Learner.init(this)
        Analytics.init(this)
        Audio.init(this)
        Cloud.init(this)
    }
}

/** A page pushed on a tab. */
sealed interface Screen {
    data class ThemeDetail(val id: String) : Screen
    data class PatternDetail(val id: String) : Screen
    data object IrregularOverview : Screen
    data class IrregularSet(val id: String) : Screen
    data object Settings : Screen
    data object Resources : Screen
    data class ResourceDetail(val id: String) : Screen
}

/** Four tabs, like the iPhone app: Vandaag (start), Leren, Arcade, Ik. Each tab keeps its own pages. */
enum class Tab(val title: String, val icon: ImageVector) {
    VANDAAG("Vandaag", Icons.Filled.Bolt), LEREN("Leren", Icons.Filled.Map), ARCADE("Arcade", Icons.Filled.SportsEsports), IK("Ik", Icons.Filled.Person)
}

object Nav {
    var tab by mutableStateOf(Tab.VANDAAG)
    val stacks = Tab.entries.associateWith { mutableStateListOf<Screen>() }
    var signIn by mutableStateOf(false)
    var levelTest by mutableStateOf(false)
    fun push(screen: Screen) { stacks.getValue(tab).add(screen) }
    fun open(theme: Theme) = push(Screen.ThemeDetail(theme.id))
}

data class RoundData(val id: Long = System.nanoTime(), val cards: List<Card>, val label: String, val drill: Boolean = false, val irregular: String? = null)
data class GameLaunch(val id: Long = System.nanoTime(), val game: GameId, val theme: String)

/** Starts practice rounds and games from any screen; they open over the screen you started them from. */
object Session {
    var round by mutableStateOf<RoundData?>(null)
    var game by mutableStateOf<GameLaunch?>(null)

    fun start(cards: List<Card>, label: String, drill: Boolean = false) {
        if (cards.isEmpty()) return
        Haptics.tap(); game = null
        round = RoundData(cards = cards, label = label, drill = drill)
    }

    fun startIrregular(setId: String, label: String) {
        val cards = Irregular.round(setId, Learner.reviews)
        if (cards.isEmpty()) return
        Haptics.tap(); game = null
        round = RoundData(cards = cards, label = label, irregular = setId)
    }

    fun start(theme: String = "all", kind: Planner.Kind = Planner.Kind.ALL, label: String, limit: Int = 20, cardIds: List<String>? = null) =
        start(Planner.plan(Learner.reviews, theme, kind, limit, cardIds), label)

    fun play(id: GameId, theme: String = "all") {
        Haptics.tap(); round = null
        game = GameLaunch(game = id, theme = theme)
    }

    fun start(step: LearningPath.StepId, theme: Theme) {
        val reviews = Learner.reviews
        val title = LearningPath.steps(theme.id, reviews).firstOrNull { it.id == step }?.title ?: ""
        when (val launch = LearningPath.launch(theme.id, step, reviews)) {
            is LearningPath.Launch.Round -> start(launch.cards, "${theme.title} · $title", launch.drill)
            is LearningPath.Launch.IrregularRound -> startIrregular(launch.set, "${theme.title} · $title")
            LearningPath.Launch.Game -> play(GameId.gesprek, theme.id)
            null -> {}
        }
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        Cloud.start()
        lifecycleScope.launch { ContentUpdater.check(applicationContext) }
        intent?.data?.let { Cloud.handle(it) }
        setContent { Root() }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        intent.data?.let { Cloud.handle(it) }
    }

    override fun onStop() {
        super.onStop()
        Audio.stop()
    }
}

@Composable
fun Root() {
    val system = isSystemInDarkTheme()
    val dark = when (Preferences.appearance) { "light" -> false; "dark" -> true; else -> system }
    C.dark = dark
    val view = LocalView.current
    SideEffect {
        Haptics.view = view
        val activity = view.context as? ComponentActivity
        activity?.enableEdgeToEdge(
            statusBarStyle = if (dark) SystemBarStyle.dark(android.graphics.Color.TRANSPARENT) else SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
            navigationBarStyle = if (dark) SystemBarStyle.dark(android.graphics.Color.TRANSPARENT) else SystemBarStyle.light(android.graphics.Color.TRANSPARENT, android.graphics.Color.TRANSPARENT),
        )
    }
    val scheme = if (dark) darkColorScheme(primary = C.brand, background = C.ground, surface = C.surface) else lightColorScheme(primary = C.brand, background = C.ground, surface = C.surface)
    MaterialTheme(colorScheme = scheme) {
        Box(Modifier.fillMaxSize().background(C.ground)) {
            if (Preferences.welcomeDone || Cloud.user != null) Tabs() else WelcomeScreen()

            val round = Session.round
            AnimatedVisibility(round != null, enter = slideInVertically { it }, exit = slideOutVertically { it }) {
                round?.let { RoundScreen(it) }
            }
            val game = Session.game
            AnimatedVisibility(game != null, enter = slideInVertically { it }, exit = slideOutVertically { it }) {
                game?.let { GameFlow(it) }
            }
            if (Nav.signIn) SignInSheet { Nav.signIn = false }
            if (Nav.levelTest) LevelTestSheet { Nav.levelTest = false }
            Cloud.message?.let { message ->
                AlertDialog(
                    onDismissRequest = { Cloud.message = null },
                    title = { Text("Let op") }, text = { Text(message) },
                    confirmButton = { TextButton({ Cloud.message = null }) { Text("OK", color = C.brand) } },
                    containerColor = C.surface, titleContentColor = C.text, textContentColor = C.secondary,
                )
            }
        }
    }
}

@Composable
fun Tabs() {
    val stack = Nav.stacks.getValue(Nav.tab)
    BackHandler(enabled = stack.isNotEmpty() || Nav.tab != Tab.VANDAAG) {
        if (stack.isNotEmpty()) stack.removeAt(stack.lastIndex) else Nav.tab = Tab.VANDAAG
    }
    Column(Modifier.fillMaxSize()) {
        Box(Modifier.weight(1f).statusBarsPadding()) {
            when (val top = stack.lastOrNull()) {
                null -> when (Nav.tab) {
                    Tab.VANDAAG -> VandaagScreen()
                    Tab.LEREN -> LerenScreen()
                    Tab.ARCADE -> SpellenScreen()
                    Tab.IK -> IkScreen()
                }
                is Screen.ThemeDetail -> Content.theme(top.id)?.let { ThemeDetailScreen(it) }
                is Screen.PatternDetail -> PatternDetailScreen(top.id)
                Screen.IrregularOverview -> IrregularOverviewScreen()
                is Screen.IrregularSet -> IrregularSetScreen(top.id)
                Screen.Settings -> SettingsScreen()
                Screen.Resources -> ResourcesScreen()
                is Screen.ResourceDetail -> ResourceDetailScreen(top.id)
            }
        }
        NavigationBar(containerColor = C.surface, tonalElevation = androidx.compose.ui.unit.Dp(0f)) {
            Tab.entries.forEach { tab ->
                NavigationBarItem(
                    selected = Nav.tab == tab,
                    onClick = { if (Nav.tab == tab) Nav.stacks.getValue(tab).clear() else Nav.tab = tab },
                    icon = { Icon(tab.icon, null) },
                    label = { Text(tab.title, fontSize = 12.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = C.brand, selectedTextColor = C.brand, indicatorColor = C.brand.copy(alpha = 0.14f),
                        unselectedIconColor = C.secondary, unselectedTextColor = C.secondary,
                    ),
                )
            }
        }
    }
}

/** Counts a screen in the anonymous statistics once it appears. */
@Composable
fun TrackScreen(name: String) {
    LaunchedEffect(name) { Analytics.screen(name) }
}
