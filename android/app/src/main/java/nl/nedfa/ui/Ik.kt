package nl.nedfa.ui

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.Laptop
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import nl.nedfa.Nav
import nl.nedfa.Screen
import nl.nedfa.Session
import nl.nedfa.TrackScreen
import nl.nedfa.data.Card
import nl.nedfa.data.Content
import nl.nedfa.data.Learner
import nl.nedfa.data.LevelPlan
import nl.nedfa.data.Planner
import nl.nedfa.data.PlacementQuestion
import nl.nedfa.data.Preferences
import nl.nedfa.data.Stats
import nl.nedfa.service.Analytics
import nl.nedfa.service.Audio
import nl.nedfa.service.Cloud
import nl.nedfa.service.Feedback
import nl.nedfa.service.Reminder

/** Ik: your progress. The gear in the top right opens Instellingen. */
@Composable
fun IkScreen() {
    TrackScreen("Ik")
    val reviews = Learner.reviews
    val events = Learner.events
    val stats = remember(reviews, events) { Stats(reviews, events) }
    val practised = stats.themes.filter { it.done > 0 }
    val user = Cloud.user
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical = 12.dp), verticalArrangement = Arrangement.spacedBy(22.dp)) {
        Box(Modifier.padding(horizontal = 20.dp)) {
            ScreenTitle("Ik", if (user == null) "Je voortgang" else "Je account") {
                PressableTile({ Nav.push(Screen.Settings) }, Modifier.size(40.dp, 45.dp), radius = 20.dp) {
                    Icon(Icons.Filled.Settings, "Instellingen", tint = C.secondary, modifier = Modifier.align(Alignment.Center))
                }
            }
        }
        Row(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(28.dp, 18.dp), verticalAlignment = Alignment.CenterVertically) {
            Mascot(if (stats.streak.today) Mood.cheer else Mood.wave, 84.dp)
            Spacer(Modifier.width(16.dp))
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                T(if (user == null) "Gast" else user.name.ifEmpty { "Mijn account" }, style = game(22, FontWeight.Black), maxLines = 1)
                T("Niveau ${stats.level.number} · ${stats.level.name}", size = 15.sp, weight = FontWeight.SemiBold, color = C.secondary)
                ThickProgress(stats.level.progress, C.butter, 12.dp)
                T(stats.level.next?.let { "${stats.level.toNext} XP tot ${it.name}" } ?: "Het hoogste niveau. Knap!", size = 12.sp, weight = FontWeight.Bold, color = C.goldInk)
                if (user == null) T("Inloggen om je voortgang te bewaren", Modifier.clickable { Nav.signIn = true }, size = 12.sp, weight = FontWeight.Bold, color = C.brand)
                else T(Cloud.status.text, size = 12.sp, color = C.secondary)
            }
        }
        Row(Modifier.padding(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatTile("${stats.streak.count}", if (stats.streak.count == 1) "dag op rij" else "dagen op rij", C.brand, Modifier.weight(1f))
            StatTile(formatNumber(stats.xp), "XP totaal", C.goldInk, Modifier.weight(1f))
            StatTile("${stats.known}", "onthouden", C.success, Modifier.weight(1f))
        }
        Row(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(24.dp, 14.dp)) {
            stats.week.forEach { day ->
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Box(Modifier.size(34.dp).background(if (day.count > 0) C.brand else C.track, CircleShape), contentAlignment = Alignment.Center) {
                        if (day.count > 0) Icon(Icons.Filled.LocalFireDepartment, null, tint = Color.White, modifier = Modifier.size(16.dp))
                    }
                    T(day.label, size = 11.sp, weight = FontWeight.SemiBold, color = C.secondary)
                }
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionTitle("Stempels") { T("${stats.earned.size} van ${Content.stamps.size}", size = 15.sp, weight = FontWeight.SemiBold, color = C.secondary) }
            Column(Modifier.padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Content.stamps.chunked(4).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        row.forEach { stamp ->
                            val earned = stamp.id in stats.earned
                            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Art("stamps/${stamp.id}", 74.dp, 22.dp, grey = !earned, modifier = Modifier.alpha(if (earned) 1f else 0.4f))
                                T(stamp.title, Modifier.heightIn(min = 30.dp), style = game(12), color = if (earned) C.text else C.secondary, align = TextAlign.Center, maxLines = 2)
                            }
                        }
                        repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            }
        }
        if (practised.isNotEmpty()) Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            SectionTitle("Jouw thema’s")
            Column(Modifier.padding(horizontal = 20.dp).fillMaxWidth().card(26.dp, 14.dp)) {
                practised.forEachIndexed { index, item ->
                    if (index > 0) Divider()
                    Row(Modifier.fillMaxWidth().clickable { Nav.open(item.theme) }.padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        PictureRow("themes/${item.theme.id}", item.theme.title, "${item.done} van ${item.total} · ${item.known} onthouden", modifier = Modifier.weight(1f))
                        StarsView(item.stars)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatTile(value: String, label: String, color: Color, modifier: Modifier) {
    Column(modifier.heightIn(min = 72.dp).tile(20.dp).padding(vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        T(value, style = game(24, FontWeight.Black), color = color, maxLines = 1)
        T(label, size = 12.sp, weight = FontWeight.SemiBold, color = C.secondary)
    }
}

/** A settings row that opens a menu of choices. */
@Composable
private fun <V> PickerRow(title: String, value: V, options: List<Pair<V, String>>, onPick: (V) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Box {
        Row(Modifier.fillMaxWidth().clickable { open = true }.padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            T(title, Modifier.weight(1f))
            T(options.firstOrNull { it.first == value }?.second ?: "", color = C.secondary)
            Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
        }
        DropdownMenu(open, { open = false }, Modifier.heightIn(max = 400.dp)) {
            options.forEach { (v, label) -> DropdownMenuItem({ Text(label) }, { onPick(v); open = false }) }
        }
    }
}

@Composable
private fun SwitchRow(title: String, detail: String? = null, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            T(title)
            if (detail != null) T(detail, size = 12.sp, color = C.secondary)
        }
        Switch(checked, onChange, colors = SwitchDefaults.colors(checkedTrackColor = C.brand))
    }
}

@Composable
private fun LinkRow(title: String, detail: String? = null, color: Color = C.text, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            T(title, color = color)
            if (detail != null) T(detail, size = 12.sp, color = C.secondary)
        }
    }
}

/** Instellingen: grouped rows. */
@Composable
fun SettingsScreen() {
    TrackScreen("Instellingen")
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }
    var confirmSignOut by remember { mutableStateOf(false) }
    var reminderDenied by remember { mutableStateOf(false) }
    var statsOn by remember { mutableStateOf(Analytics.enabled) }
    var feedback by remember { mutableStateOf(false) }
    var pendingHour by remember { mutableIntStateOf(19) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        reminderDenied = !granted
        if (granted) { Preferences.changeReminderHour(pendingHour); Reminder.schedule(context, pendingHour) }
    }
    fun setReminder(hour: Int?) {
        if (hour == null) { Preferences.changeReminderHour(null); Reminder.schedule(context, null); return }
        pendingHour = hour
        if (Build.VERSION.SDK_INT >= 33 && !Reminder.allowed(context)) permission.launch(Manifest.permission.POST_NOTIFICATIONS)
        else { Preferences.changeReminderHour(hour); Reminder.schedule(context, hour) }
    }
    val open = { url: String -> runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } }
    val user = Cloud.user

    Page("Instellingen") {
        Group("Oefenen") {
            PickerRow("Dagdoel", Preferences.goal, Preferences.goals.map { it to "$it kaartjes" }) { Preferences.setGoal(it) }
            Divider()
            PickerRow("Stem", Preferences.voice, Content.audio.voices.map { it.id to it.name }) { Preferences.changeVoice(it) }
            Divider()
            PickerRow("Snelheid", Preferences.speed, Audio.speeds.map { it to "${it.toString().trimEnd('0').trimEnd('.').replace('.', ',')}×" }) { Preferences.changeSpeed(it) }
            Divider()
            LinkRow("Luister naar een voorbeeld", color = C.brand) { Audio.play("Goedemorgen! Ik leer Nederlands. Op woensdag werk ik thuis. Hoe gaat het met je?") }
        }
        val reminderFooter = when {
            reminderDenied -> "Zet meldingen aan voor Nedfa in de instellingen van je telefoon."
            Preferences.reminderHour != null && Preferences.newsReminder -> "Nog steeds één melding per dag, met het nieuws erbij."
            else -> null
        }
        Group("Herinnering", reminderFooter) {
            SwitchRow("Dagelijkse herinnering", checked = Preferences.reminderHour != null) { setReminder(if (it) 19 else null) }
            Preferences.reminderHour?.let { hour ->
                Divider()
                PickerRow("Hoe laat?", hour, listOf(7, 8, 9, 12, 17, 18, 19, 20, 21).map { it to "$it:00" }) { setReminder(it) }
                Divider()
                SwitchRow("Ook het nieuws noemen", checked = Preferences.newsReminder) { Preferences.changeNewsReminder(it) }
            }
        }
        Group("Niveau") {
            val level = Preferences.level
            LinkRow(level?.let { "$it · ${LevelPlan.info[it]?.first ?: ""}" } ?: "Nog geen niveau",
                if (level == null) "Doe de niveautest (± 3 min)" else "Thema’s voor dit niveau staan bovenaan. Tik om de test opnieuw te doen.") { Nav.levelTest = true }
        }
        Group("Weergave") {
            Box(Modifier.padding(vertical = 10.dp)) {
                val options = listOf("light" to "Licht", "dark" to "Donker", "system" to "Systeem")
                Segmented(options.map { it.second }, options.indexOfFirst { it.first == Preferences.appearance }.coerceAtLeast(0)) { Preferences.changeAppearance(options[it].first) }
            }
        }
        Group("Account") {
            if (user != null) {
                Column(Modifier.padding(vertical = 10.dp)) {
                    T(user.email.ifEmpty { user.name }, weight = FontWeight.Medium)
                    T(Cloud.status.text, size = 13.sp, color = C.secondary)
                }
                Divider()
                ProviderRow("google", user)
                Divider()
                ProviderRow("apple", user)
                Divider()
                LinkRow("Uitloggen", color = C.brand) { confirmSignOut = true }
            } else {
                LinkRow("Inloggen met Google", color = C.brand) { Nav.signIn = true }
            }
            Divider()
            LinkRow(if (user == null) "Wis mijn voortgang" else "Account verwijderen", color = C.danger) { confirmDelete = true }
        }
        Group("Meer") {
            LinkRow("Feedback geven", "Een probleem, idee of compliment") { feedback = true }
            Divider()
            Row(Modifier.fillMaxWidth().clickable { Nav.push(Screen.Resources) }.padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                PictureRow("themes/bronnen", "Websites & boeken", size = 36.dp, modifier = Modifier.weight(1f)); Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
            }
            Divider()
            SwitchRow("Anonieme statistieken", "Welke schermen gebruikt worden, zonder naam", statsOn) { statsOn = it; Analytics.enabled = it }
            Divider()
            LinkRow("Privacy", color = C.brand) { open("https://nedfa.nl/privacy") }
            Divider()
            LinkRow("nedfa.nl", color = C.brand) { open("https://nedfa.nl") }
        }
        T("Nedfa ${nl.nedfa.BuildConfig.VERSION_NAME} (${nl.nedfa.BuildConfig.VERSION_CODE})", Modifier.fillMaxWidth(), size = 12.sp, color = C.tertiary, align = TextAlign.Center)
    }
    if (confirmSignOut) Confirm("Uitloggen?", "Je voortgang blijft bewaard in je account. Op deze telefoon oefen je daarna als gast, tot je weer inlogt.", "Uitloggen", { Cloud.signOut() }, { confirmSignOut = false })
    if (confirmDelete) Confirm(
        if (user == null) "Je voortgang wissen?" else "Je account verwijderen?",
        if (user == null) "Alles op deze telefoon wordt gewist: je oefeningen, planning, reeks, records en instellingen. Dit kun je niet ongedaan maken."
        else "Je account en alles wat erbij hoort worden definitief verwijderd, online en op deze telefoon. Dit kun je niet ongedaan maken.",
        if (user == null) "Wis alles" else "Verwijder account", { Cloud.deleteAccount(); Reminder.schedule(context, null) }, { confirmDelete = false }, destructive = true,
    )
    if (feedback) FeedbackSheet { feedback = false }
}

/** Google or Apple on the account: linked, or (for Google) a button to add it. Apple can only be added on an iPhone or the website. */
@Composable
private fun ProviderRow(provider: String, user: Cloud.User) {
    val context = LocalContext.current
    val linked = user.has(provider)
    val name = if (provider == "apple") "Apple" else "Google"
    var confirmUnlink by remember { mutableStateOf(false) }
    var confirmLink by remember { mutableStateOf(false) }
    Row(Modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            T(name, weight = FontWeight.Medium)
            T(if (linked) "Gekoppeld" else if (provider == "google") "Koppel Google om ook daarmee in te loggen" else "Koppelen kan op je iPhone of op nedfa.nl", size = 12.sp, color = C.secondary)
        }
        if (linked) {
            if (user.providers.size > 1) T("Ontkoppel", Modifier.clickable { confirmUnlink = true }.padding(6.dp), size = 15.sp, color = C.secondary)
            else Icon(Icons.Filled.CheckCircle, null, tint = C.success)
        } else if (provider == "google") {
            T("Koppelen", Modifier.border(1.dp, C.brand, CircleShape).clickable { confirmLink = true }.padding(horizontal = 14.dp, vertical = 6.dp), size = 15.sp, color = C.brand, weight = FontWeight.SemiBold)
        }
    }
    if (confirmLink) Confirm("$name koppelen?", "Daarna kun je met ${if (user.has("apple")) "Apple" else "Google"} én $name op hetzelfde account inloggen. Heb je met dat $name-account al geoefend, dan voegen we die voortgang samen.", "Koppelen", { Cloud.signInWithGoogle(context, link = true) }, { confirmLink = false })
    if (confirmUnlink) Confirm("$name ontkoppelen?", "Je kunt dan niet meer met $name inloggen op dit account. Je voortgang blijft bewaard en je kunt $name later opnieuw koppelen.", "Ontkoppelen", { Cloud.unlink(provider) }, { confirmUnlink = false }, destructive = true)
}

@Composable
fun ResourcesScreen() {
    TrackScreen("Websites & boeken")
    Page("Websites & boeken") {
        Group {
            Content.resources.forEachIndexed { index, resource ->
                if (index > 0) Divider()
                Row(Modifier.fillMaxWidth().clickable { Nav.push(Screen.ResourceDetail(resource.id)) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        T(resource.name, weight = FontWeight.SemiBold)
                        T("${resource.level} · ${resource.categories.joinToString(", ")} · ${resource.cost}", size = 12.sp, color = C.secondary)
                    }
                    Icon(Icons.Filled.ChevronRight, null, tint = C.tertiary)
                }
            }
        }
    }
}

@Composable
fun ResourceDetailScreen(id: String) {
    val resource = Content.resources.firstOrNull { it.id == id } ?: return
    val context = LocalContext.current
    Page(resource.name) {
        Group {
            Column(Modifier.padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                T(resource.description)
                T("Niveau: ${resource.level}", color = C.secondary)
                T("Kosten: ${resource.cost}", color = C.secondary)
                resource.time?.let { T("Tijd: $it", color = C.secondary) }
                resource.note?.let { T(it, size = 13.sp, color = C.secondary) }
            }
        }
        Group("Zo gebruik je het") {
            Column(Modifier.padding(vertical = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { resource.steps.forEachIndexed { i, s -> T("${i + 1}. $s") } }
        }
        if (resource.url.isNotEmpty()) Group { LinkRow("Open ${resource.name}", color = C.brand) { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(resource.url))) } } }
    }
}

// Sign in

@Composable
private fun SignInReasons() {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        listOf(Icons.Filled.PhoneAndroid to "Op je telefoon in de app", Icons.Filled.Laptop to "Op je laptop op nedfa.nl", Icons.Filled.Cloud to "Je reeks, XP en planning gaan mee").forEach { (icon, text) ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, null, tint = C.brand, modifier = Modifier.width(28.dp))
                Spacer(Modifier.width(12.dp))
                T(text, size = 15.sp)
            }
        }
    }
}

@Composable
private fun GoogleButton(onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().height(52.dp).background(C.surface, RoundedCornerShape(14.dp)).border(1.dp, C.tertiary, RoundedCornerShape(14.dp)).clickable(onClick = onClick),
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically,
    ) {
        T("G", style = game(20, FontWeight.Black), color = Color(0xFF4285F4))
        Spacer(Modifier.width(10.dp))
        T("Ga door met Google", size = 18.sp, weight = FontWeight.Medium)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SignInSheet(dismiss: () -> Unit) {
    val context = LocalContext.current
    ModalBottomSheet(dismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = C.ground) {
        Column(Modifier.padding(24.dp).navigationBarsPadding(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Mascot(Mood.wave, 110.dp)
            T("Log in en ga overal verder", style = game(24), align = TextAlign.Center)
            Box(Modifier.fillMaxWidth()) { SignInReasons() }
            GoogleButton { Cloud.signInWithGoogle(context); dismiss() }
            T("Met hetzelfde e-mailadres als bij Apple kom je vanzelf in hetzelfde account. Koos je bij Apple voor ‘Verberg mijn e-mail’? Koppel dan eerst Google op je iPhone bij Ik › Instellingen.", size = 13.sp, color = C.secondary, align = TextAlign.Center)
            T("Je kunt je account altijd verwijderen bij Ik › Instellingen.", size = 13.sp, color = C.secondary, align = TextAlign.Center)
        }
    }
}

@Composable
fun WelcomeScreen() {
    TrackScreen("Welkom")
    val context = LocalContext.current
    Column(
        Modifier.fillMaxSize().background(C.ground).statusBarsPadding().navigationBarsPadding().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Spacer(Modifier.height(24.dp))
        MascotActor("wave", MascotMoment.Greet, 170.dp, delayMillis = 300)
        T("NEDFA · NEDERLANDS VAN NUL TOT B1", style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp), color = C.brand)
        T("Elke dag een beetje Nederlands.", style = game(32, FontWeight.Black), align = TextAlign.Center)
        T("Thema’s met audio, spellen en slim herhalen. Een paar minuten per dag is genoeg.", color = C.secondary, align = TextAlign.Center)
        Spacer(Modifier.height(12.dp))
        Box(Modifier.fillMaxWidth().background(C.surface, RoundedCornerShape(18.dp)).padding(16.dp)) { SignInReasons() }
        if (Cloud.status == Cloud.Status.STARTING) T("Even kijken of je al bent ingelogd…", color = C.secondary)
        else GoogleButton { Cloud.signInWithGoogle(context) }
        T("Eerst proberen zonder account", Modifier.clickable { Preferences.changeWelcomeDone(true) }.padding(8.dp), weight = FontWeight.SemiBold, color = C.brand)
        T("Je kunt later altijd nog inloggen. Je voortgang gaat dan mee.", size = 13.sp, color = C.secondary, align = TextAlign.Center)
    }
}

// Word sheet and feedback

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WordSheet(card: Card, dismiss: () -> Unit) {
    TrackScreen("Kaartje: ${card.nl ?: ""}")
    ModalBottomSheet(dismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = C.ground) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 24.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            card.themeTitle?.let { T(it, Modifier.fillMaxWidth(), weight = FontWeight.SemiBold, align = TextAlign.Center) }
            Column(Modifier.fillMaxWidth().card(24.dp, 18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) { T(card.nl ?: "", Modifier.weight(1f), style = game(26, FontWeight.Black)); ListenButton(card.nl ?: "") }
                card.meaning?.let { Divider(); Persian(it, 20, C.text) }
            }
            card.example?.let { example ->
                T("Zo gebruik je het", style = game(17))
                Column(Modifier.fillMaxWidth().card(24.dp, 18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(verticalAlignment = Alignment.Top) { T(example, Modifier.weight(1f), weight = FontWeight.SemiBold); ListenButton(example, 14) }
                    card.translation?.let { Divider(); Persian(it) }
                }
            }
            card.forms?.takeIf { it.size == 3 }?.let { forms ->
                T("Vormen", style = game(17))
                Column(Modifier.fillMaxWidth().card(24.dp, 18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    listOf("Imperfectum", "Perfectum", "Soort").forEachIndexed { i, label ->
                        if (i > 0) Divider()
                        Row { T(label, Modifier.weight(1f)); T(forms[i], color = C.secondary) }
                    }
                }
            }
            GameButton("Oefen dit kaartje", { dismiss(); Session.start(listOf(card), "Eén kaartje") }, Modifier.padding(top = 8.dp), icon = Icons.Filled.Bolt, trailingIcon = false)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FeedbackSheet(dismiss: () -> Unit) {
    var kind by remember { mutableStateOf("idee") }
    var message by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val kinds = listOf("probleem" to "Probleem", "idee" to "Idee", "compliment" to "Compliment")
    ModalBottomSheet(dismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = C.ground) {
        Column(Modifier.padding(20.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            T("Feedback geven", style = game(22))
            Segmented(kinds.map { it.second }, kinds.indexOfFirst { it.first == kind }) { kind = kinds[it].first }
            Box(Modifier.fillMaxWidth().heightIn(min = 140.dp).background(C.surface, RoundedCornerShape(14.dp)).padding(14.dp)) {
                if (message.isEmpty()) T(when (kind) { "probleem" -> "Wat ging er mis? Wat verwachtte je?"; "idee" -> "Wat zou de app beter of leuker maken?"; else -> "Wat vind je fijn?" }, color = C.tertiary)
                BasicTextField(message, { message = it }, Modifier.fillMaxWidth(), textStyle = TextStyle(fontSize = 16.sp, color = C.text), cursorBrush = SolidColor(C.brand))
            }
            if (state == "sent") T("Dank je wel! We lezen alles.", color = C.success, weight = FontWeight.SemiBold)
            if (state == "failed") T("Versturen lukt nu niet. Probeer het later opnieuw.", color = C.danger)
            GameButton(if (state == "sending") "Versturen…" else "Verstuur", {
                state = "sending"
                scope.launch {
                    val ok = Feedback.send(kind, message, "Instellingen")
                    state = if (ok) "sent" else "failed"
                    if (ok) { delay(1200); dismiss() }
                }
            }, enabled = message.isNotBlank() && state != "sending")
        }
    }
}

// Niveautest

/** The niveautest: short questions from easy to hard; it stops at the learner's level and saves it. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LevelTestSheet(dismiss: () -> Unit) {
    TrackScreen("Niveautest")
    val placement = Content.placement
    val blocks = remember { placement.questions.groupBy { it.level }.mapValues { (_, list) -> list.map { it.copy(options = it.options.shuffled()) } } }
    var step by remember { mutableStateOf<Pair<String, Int>?>(null) }
    var result by remember { mutableStateOf<String?>(null) }
    val right = remember { mutableStateMapOf<String, Int>() }
    var picked by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun finish(level: String, skipped: Boolean = false) {
        Preferences.setLevel(level)
        Analytics.event("niveautest", mapOf("niveau" to level, "overgeslagen" to skipped))
        Haptics.success()
        result = level
    }

    fun answer(option: String, item: PlacementQuestion, level: String, index: Int) {
        if (picked != null) return
        val correct = option == item.answer
        picked = option
        if (correct) Haptics.success() else Haptics.error()
        right[level] = (right[level] ?: 0) + if (correct) 1 else 0
        scope.launch {
            delay(if (correct) 450 else 900)
            picked = null
            val block = blocks[level]?.size ?: 5
            val asked = index + 1
            val score = right[level] ?: 0
            // Keep going while the block can still be passed.
            if (asked < block && score + (block - asked) >= placement.passMark) { step = level to asked; return@launch }
            val next = LevelPlan.levels.indexOf(level) + 1
            if (score >= placement.passMark && next < LevelPlan.levels.size) { step = LevelPlan.levels[next] to 0; return@launch }
            finish(LevelPlan.result(right, placement.passMark))
        }
    }

    ModalBottomSheet(dismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = C.ground) {
        Column(Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 20.dp).padding(bottom = 24.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            T(if (result != null) "Jouw niveau" else "Niveautest", Modifier.fillMaxWidth(), weight = FontWeight.SemiBold, align = TextAlign.Center)
            val current = step
            val level = result
            when {
                level != null -> {
                    val info = LevelPlan.info[level] ?: ("" to "")
                    val stats = Stats(Learner.reviews, Learner.events)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Mascot(Mood.cheer, 84.dp); Spacer(Modifier.width(16.dp))
                        Column { T(level, style = game(44, FontWeight.Black), color = C.brand); T(info.first, style = game(20)) }
                    }
                    T("${info.second} Thema’s voor jouw niveau staan voortaan bovenaan. Je kunt de test altijd opnieuw doen bij Instellingen.", size = 15.sp, color = C.secondary)
                    T("Begin hiermee", style = game(17))
                    LevelPlan.suggested(level, stats).forEach { theme ->
                        PressableTile({ dismiss(); Session.start(theme.id, Planner.Kind.WOORDEN, theme.title) }, Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                Art("themes/${theme.id}", 44.dp, 12.dp); Spacer(Modifier.width(12.dp))
                                T(theme.title, Modifier.weight(1f), weight = FontWeight.SemiBold)
                                Icon(Icons.Filled.PlayArrow, null, tint = C.brand)
                            }
                        }
                    }
                    GameButton("Klaar", dismiss)
                }
                current == null -> {
                    Row(Modifier.fillMaxWidth().card(22.dp, 14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Mascot(Mood.think, 64.dp); Spacer(Modifier.width(14.dp))
                        T("Je krijgt korte vragen, eerst heel makkelijk en daarna moeilijker. Weet je het niet? Kies dan gewoon. De test stopt vanzelf op jouw niveau.", size = 15.sp)
                    }
                    GameButton("Start de test", { right.clear(); step = "A0" to 0 }, icon = Icons.AutoMirrored.Filled.ArrowForward)
                    T("Ik begin bij nul", Modifier.fillMaxWidth().clickable { finish("A0", skipped = true) }.padding(8.dp), weight = FontWeight.SemiBold, color = C.brand, align = TextAlign.Center)
                }
                else -> {
                    val (lvl, index) = current
                    val list = blocks[lvl] ?: emptyList()
                    val item = list.getOrNull(index) ?: placement.questions.firstOrNull() ?: return@Column
                    val done = (LevelPlan.levels.indexOf(lvl) * 5 + index).toDouble() / maxOf(1, placement.questions.size)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ThickProgress(maxOf(0.04, done), C.mint, 12.dp, Modifier.weight(1f)); Spacer(Modifier.width(10.dp)); T(lvl, size = 12.sp, weight = FontWeight.Black, color = C.secondary)
                    }
                    Eyebrow(when (item.kind) { "fill" -> "Welk woord past?"; "meaning" -> "Wat betekent dit?"; else -> "Wat betekent deze zin?" })
                    T(if (item.kind == "fill") item.prompt.replace("___", picked?.let { " $it " } ?: " ____ ") else item.prompt, style = game(26, FontWeight.Black))
                    item.options.forEach { option ->
                        val persian = option.any { it in '؀'..'ۿ' }
                        val fill = when { picked == null -> C.surface; option == item.answer -> C.mintSoft; option == picked -> C.dangerSoft; else -> C.surface }
                        PressableTile({ answer(option, item, lvl, index) }, Modifier.fillMaxWidth(), fill = fill, radius = 18.dp, enabled = picked == null) {
                            Row(Modifier.fillMaxWidth().heightIn(min = 56.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(option, Modifier.weight(1f), color = C.text, style = TextStyle(fontSize = 17.sp, fontWeight = FontWeight.SemiBold, textDirection = if (persian) TextDirection.Rtl else TextDirection.Ltr, textAlign = if (persian) TextAlign.Right else TextAlign.Left))
                                if (picked != null && option == item.answer) Icon(Icons.Filled.CheckCircle, null, tint = C.success)
                                else if (picked == option) Icon(Icons.Filled.Cancel, null, tint = C.danger)
                            }
                        }
                    }
                }
            }
        }
    }
}
