import WidgetKit
import SwiftUI

private let appGroupId = "group.com.affirmationflow.app"

struct AffirmationEntry: TimelineEntry {
    let date: Date
    let text: String
    let category: String
}

struct AffirmationProvider: TimelineProvider {
    func placeholder(in context: Context) -> AffirmationEntry {
        AffirmationEntry(
            date: Date(),
            text: "I am enough, and I am growing every day.",
            category: "Self-Love"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (AffirmationEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AffirmationEntry>) -> Void) {
        let entry = loadEntry()
        let next = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date().addingTimeInterval(21600)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func loadEntry() -> AffirmationEntry {
        let defaults = UserDefaults(suiteName: appGroupId)
        let text = defaults?.string(forKey: "widgetText")?.trimmingCharacters(in: .whitespacesAndNewlines)
        let category = defaults?.string(forKey: "widgetCategory")?.trimmingCharacters(in: .whitespacesAndNewlines)
        return AffirmationEntry(
            date: Date(),
            text: (text?.isEmpty == false) ? text! : "Open AffirmEaze for today's affirmation.",
            category: (category?.isEmpty == false) ? category! : "AffirmEaze"
        )
    }
}

struct AffirmEazeWidgetEntryView: View {
    var entry: AffirmationEntry

    var body: some View {
        content
            .padding(16)
            .background(widgetBackground)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(entry.category.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(Color(red: 0.91, green: 0.66, blue: 0.49))
            Text(entry.text)
                .font(.system(size: 16, weight: .light, design: .serif))
                .foregroundColor(Color(red: 0.97, green: 0.96, blue: 1.0))
                .lineLimit(6)
                .minimumScaleFactor(0.85)
            Spacer(minLength: 0)
            Text("AffirmEaze")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Color.white.opacity(0.7))
        }
    }

    private var widgetBackground: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.10, green: 0.08, blue: 0.15),
                Color(red: 0.49, green: 0.36, blue: 0.75)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

@main
struct AffirmEazeWidget: Widget {
    let kind: String = "AffirmEazeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AffirmationProvider()) { entry in
            AffirmEazeWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Today's affirmation")
        .description("Keep today's line on your Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
