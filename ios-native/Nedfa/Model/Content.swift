import Foundation

/// The lesson content, exported from the website's content files by scripts/native/export-content.mjs.
struct Option: Codable, Hashable {
    let label: String
    let correct: Bool
}

struct Card: Codable, Identifiable, Hashable {
    enum Kind: String, Codable { case word, phrase, grammar }
    enum Mode: String, Codable { case choose, reverse, listen, type, gap, flash, order, pick, form }
    struct Order: Codable, Hashable {
        let first: String
        let tiles: [String]
        let answer: [String]
        let ending: String
    }

    let id: String
    let kind: Kind
    let themeId: String
    let themeTitle: String?
    let wordKind: String?
    let nl: String?
    let example: String?
    let forms: [String]?
    let meaning: String?
    let translation: String?
    let level: String?
    let title: String?
    let pattern: String?
    let prompt: String?
    let answer: String?
    let rule: String?
    let note: String?
    let hasAudio: Bool
    let exampleAudio: Bool
    let meaningOptions: [Option]?
    let dutchOptions: [Option]?
    // Set on exercises built for one grammar pattern.
    var mode: Mode? = nil
    var order: Order? = nil
    var pick: [Option]? = nil
    // Onregelmatig (mode .form): the set, the whole row, which cell is asked, accepted answers and the four choices.
    var set: String? = nil
    var chain: [String]? = nil
    var labels: [String]? = nil
    var ask: Int? = nil
    var accept: [String]? = nil
    var choices: [Option]? = nil

    /// What the card is called in lists: the Dutch word or sentence, or the pattern's title.
    var label: String { nl ?? title ?? id }
}

struct Theme: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let meaning: String
    let intro: String
    let group: String
    /// A0 (starting from zero), A1, A2 or B1; older content has none (A2).
    let level: String?
    var levelOrDefault: String { level ?? "A2" }
    /// The grammar rules (zin:…) you need in this situation, and an Onregelmatig set that goes with it (step 3 of the path).
    var grammar: [String]? = nil
    var irregular: String? = nil
}

/// A section of the path in Leren: situations in the order you learn them.
struct PathSection: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let fa: String
    let level: String
    let themeIds: [String]
}

/// The niveautest: five questions per level; a block is passed with `passMark` right answers.
struct Placement: Codable {
    struct Question: Codable, Hashable {
        let level: String
        let kind: String
        let prompt: String
        let answer: String
        let options: [String]
    }
    let passMark: Int
    let questions: [Question]
}

struct ThemeGroup: Codable, Identifiable {
    let id: String
    let title: String
    let themeIds: [String]
}

struct Example: Codable, Hashable {
    let nl: String
    let gap: String
    let translation: String
    let hasAudio: Bool
}

struct Pattern: Codable, Identifiable {
    let id: String
    let examples: [Example]
    let drill: [Card]
}

struct DialogueLine: Codable, Identifiable, Hashable {
    let id: String
    let speaker: String
    let nl: String
    let translation: String
    let hasAudio: Bool
}

struct Dialogue: Codable, Identifiable {
    let id: String
    let themeId: String
    let lines: [DialogueLine]
}

struct Lesson: Codable, Identifiable {
    let id: String
    let title: String
    let level: String
    let grammarIds: [String]
    let themeIds: [String]
    let cardIds: [String]
    let goal: String
    let task: String
}

struct LevelInfo: Codable { let name: String; let xp: Int }
struct StampInfo: Codable, Identifiable { let id: String; let title: String; let description: String }

struct Resource: Codable, Identifiable {
    let id: String
    let name: String
    let categories: [String]
    let level: String
    let cost: String
    let description: String
    let url: String
    let steps: [String]
    let time: String?
    let note: String?
}

struct AudioCatalog: Codable {
    struct Voice: Codable, Identifiable { let id: String; let name: String }
    let voices: [Voice]
    let clips: [String: String]
}

struct GameData: Codable {
    struct Article: Codable { let cardId: String; let article: String; let noun: String }
    struct Verb: Codable { let cardId: String; let kind: String; let answer: String; let options: [Option] }
    struct Cloze: Codable { let cardId: String; let before: String; let after: String; let answer: String; let options: [Option] }
    struct Builder: Codable { let cardId: String; let first: String; let answer: [String]; let tiles: [String]; let ending: String; let sentence: String }
    struct Conversation: Codable {
        struct Step: Codable {
            struct Choice: Codable { let lineId: String; let correct: Bool }
            let lineId: String
            let options: [Choice]?
        }
        let dialogueId: String
        let steps: [Step]
    }
    let articles: [Article]
    let verbs: [Verb]
    let cloze: [Cloze]
    let dictation: [String]
    let builder: [Builder]
    let conversations: [Conversation]
}

/// Onregelmatig: sets of irregular forms (strong verbs, plurals, comparisons, present tense) you learn by heart.
struct IrregularData: Codable {
    struct Row: Codable, Hashable { let id: String; let cells: [String]; let fa: String }
    struct Set: Codable, Identifiable, Hashable {
        let id: String
        let kind: String
        let group: String
        let title: String
        let pattern: String
        let level: String
        let rule: String
        let cardIds: [String]
        let rows: [Row]
    }
    let intro: String
    let sets: [Set]
    let cards: [Card]
}

struct ContentFile: Codable {
    let version: String?
    let themes: [Theme]
    let groups: [ThemeGroup]
    let cards: [Card]
    let patterns: [Pattern]
    let dialogues: [Dialogue]
    let lessons: [Lesson]
    let levels: [LevelInfo]
    let placement: Placement?
    let stamps: [StampInfo]
    let resources: [Resource]
    let audio: AudioCatalog
    let games: GameData
    /// Missing in content downloaded before Onregelmatig existed.
    let irregular: IrregularData?
    /// Missing in content downloaded before the path existed.
    let path: [PathSection]?
}

/// All content, loaded once at launch: the newest copy from nedfa.nl if one was downloaded, else the bundled one.
final class Content: Sendable {
    static let shared = Content()

    let version: String?
    let themes: [Theme]
    let groups: [ThemeGroup]
    let cards: [Card]
    let patterns: [Pattern]
    let dialogues: [Dialogue]
    let lessons: [Lesson]
    let levels: [LevelInfo]
    let placement: Placement
    let stamps: [StampInfo]
    let resources: [Resource]
    let audio: AudioCatalog
    let games: GameData
    let irregular: IrregularData
    let path: [PathSection]
    private let byId: [String: Card]

    private init() {
        let bundled = { try! JSONDecoder().decode(ContentFile.self, from: Data(contentsOf: Bundle.main.url(forResource: "content", withExtension: "json")!)) }
        // A copy downloaded before this build's content format (no path yet) is older than the bundled one: use the bundled one.
        let file = ContentUpdater.downloaded().flatMap { $0.path == nil ? nil : $0 } ?? bundled()
        version = file.version
        themes = file.themes
        groups = file.groups
        cards = file.cards
        patterns = file.patterns
        dialogues = file.dialogues
        lessons = file.lessons
        levels = file.levels
        // A copy downloaded before the niveautest existed has no questions; the bundled file always has them.
        placement = file.placement ?? bundled().placement ?? Placement(passMark: 4, questions: [])
        stamps = file.stamps
        resources = file.resources
        audio = file.audio
        games = file.games
        irregular = file.irregular ?? bundled().irregular ?? IrregularData(intro: "", sets: [], cards: [])
        path = file.path ?? bundled().path ?? []
        byId = Dictionary((file.cards + irregular.cards).map { ($0.id, $0) }, uniquingKeysWith: { first, _ in first })
    }

    func card(_ id: String) -> Card? { byId[id] }
    /// Every id progress can be saved for: lesson cards and irregular forms.
    var allIds: Swift.Set<String> { Swift.Set(byId.keys).union(themes.map { "gesprek:\($0.id)" }) }
    func irregularSet(_ id: String) -> IrregularData.Set? { irregular.sets.first { $0.id == id } }
    func irregularCards(in set: IrregularData.Set) -> [Card] { set.cardIds.compactMap { byId[$0] } }
    func theme(_ id: String) -> Theme? { themes.first { $0.id == id } }
    var words: [Card] { cards.filter { $0.kind == .word } }
    var phrases: [Card] { cards.filter { $0.kind == .phrase } }
    var grammar: [Card] { cards.filter { $0.kind == .grammar } }
    func words(in theme: String) -> [Card] { cards.filter { $0.kind == .word && $0.themeId == theme } }
    func phrases(in theme: String) -> [Card] { cards.filter { $0.kind == .phrase && $0.themeId == theme } }
    func dialogue(for theme: String) -> Dialogue? { dialogues.first { $0.themeId == theme } }
    func pattern(_ id: String) -> Pattern? { patterns.first { $0.id == id } }
    func line(_ id: String) -> DialogueLine? {
        for dialogue in dialogues { if let line = dialogue.lines.first(where: { $0.id == id }) { return line } }
        return nil
    }
}
