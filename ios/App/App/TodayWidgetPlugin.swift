import Foundation
import Capacitor
import WidgetKit

private let appGroupId = "group.com.affirmationflow.app"

@objc(TodayWidgetPlugin)
public class TodayWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TodayWidgetPlugin"
    public let jsName = "TodayWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateToday", returnType: CAPPluginReturnPromise)
    ]

    @objc func updateToday(_ call: CAPPluginCall) {
        let text = call.getString("text") ?? ""
        let category = call.getString("category") ?? ""
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(text, forKey: "widgetText")
        defaults?.set(category, forKey: "widgetCategory")
        defaults?.set(Date().timeIntervalSince1970, forKey: "widgetUpdatedAt")
        defaults?.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }

        call.resolve()
    }
}
