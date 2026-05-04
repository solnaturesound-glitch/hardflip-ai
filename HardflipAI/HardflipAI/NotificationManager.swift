import Foundation
import UserNotifications

// MARK: - NotificationManager
// Handles all push notification scheduling for Hardflip AI.
// Schedules check-ins for each step and manages escalation reminders.

@MainActor
final class NotificationManager: NSObject, ObservableObject {

    static let shared = NotificationManager()

    @Published var permissionGranted: Bool = false
    @Published var pendingNotificationCount: Int = 0

    // Notification categories
    static let checkInCategory = "CHECKIN"
    static let escalationCategory = "ESCALATION"

    // Action identifiers
    static let actionDone = "ACTION_DONE"
    static let actionNotYet = "ACTION_NOT_YET"
    static let actionSkip = "ACTION_SKIP"

    private override init() {
        super.init()
    }

    // MARK: - Setup

    func setup() {
        UNUserNotificationCenter.current().delegate = self
        registerCategories()
        checkPermissionStatus()
    }

    private func registerCategories() {
        let doneAction = UNNotificationAction(
            identifier: Self.actionDone,
            title: "✅ DONE",
            options: [.foreground]
        )
        let notYetAction = UNNotificationAction(
            identifier: Self.actionNotYet,
            title: "⏳ Not yet",
            options: []
        )
        let skipAction = UNNotificationAction(
            identifier: Self.actionSkip,
            title: "Skip this step",
            options: [.destructive]
        )

        let checkInCategory = UNNotificationCategory(
            identifier: Self.checkInCategory,
            actions: [doneAction, notYetAction, skipAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        let escalationCategory = UNNotificationCategory(
            identifier: Self.escalationCategory,
            actions: [doneAction, notYetAction],
            intentIdentifiers: [],
            options: .customDismissAction
        )

        UNUserNotificationCenter.current().setNotificationCategories([checkInCategory, escalationCategory])
    }

    // MARK: - Permission

    func requestPermission() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(
                options: [.alert, .sound, .badge]
            )
            permissionGranted = granted
            return granted
        } catch {
            print("NotificationManager: Permission error — \(error)")
            return false
        }
    }

    func checkPermissionStatus() {
        Task {
            let settings = await UNUserNotificationCenter.current().notificationSettings()
            permissionGranted = settings.authorizationStatus == .authorized
        }
    }

    // MARK: - Schedule Step Check-In

    /// Schedules a check-in notification for a step.
    /// Returns the notification identifier.
    @discardableResult
    func scheduleCheckIn(
        for step: Step,
        in goal: Goal,
        at date: Date
    ) async -> String {
        let notificationID = "checkin-\(goal.id)-\(step.id)"

        let content = UNMutableNotificationContent()
        content.title = checkInTitle(for: step, escalationLevel: 0)
        content.body = checkInBody(for: step, goal: goal, escalationLevel: 0)
        content.sound = .default
        content.categoryIdentifier = Self.checkInCategory
        content.userInfo = [
            "goalID": goal.id.uuidString,
            "stepID": step.id.uuidString,
            "type": "checkin",
            "escalationLevel": 0
        ]
        content.badge = NSNumber(value: 1)

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: max(date.timeIntervalSinceNow, 5),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: notificationID,
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("NotificationManager: Failed to schedule check-in — \(error)")
        }

        return notificationID
    }

    // MARK: - Schedule All Steps

    /// Schedules check-ins for all steps in a goal.
    func scheduleAllSteps(for goal: Goal) async -> [String: [String]] {
        var stepNotificationMap: [String: [String]] = [:]

        for step in goal.steps where step.scheduledAt != nil {
            guard let date = step.scheduledAt else { continue }
            let notifID = await scheduleCheckIn(for: step, in: goal, at: date)
            stepNotificationMap[step.id.uuidString] = [notifID]
        }

        return stepNotificationMap
    }

    // MARK: - Escalation

    /// Schedules an escalation notification if the user hasn't responded.
    @discardableResult
    func scheduleEscalation(
        for step: Step,
        in goal: Goal,
        escalationLevel: Int,
        delayMinutes: Int
    ) async -> String {
        let notificationID = "escalation-\(goal.id)-\(step.id)-\(escalationLevel)"

        let content = UNMutableNotificationContent()
        content.title = escalationTitle(level: escalationLevel)
        content.body = escalationBody(for: step, goal: goal, level: escalationLevel)
        content.sound = escalationLevel >= 2 ? .defaultCritical : .default
        content.categoryIdentifier = Self.escalationCategory
        content.userInfo = [
            "goalID": goal.id.uuidString,
            "stepID": step.id.uuidString,
            "type": "escalation",
            "escalationLevel": escalationLevel
        ]
        content.badge = NSNumber(value: escalationLevel + 1)

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(delayMinutes * 60),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: notificationID,
            content: content,
            trigger: trigger
        )

        do {
            try await UNUserNotificationCenter.current().add(request)
        } catch {
            print("NotificationManager: Failed to schedule escalation — \(error)")
        }

        return notificationID
    }

    // MARK: - Cancel Notifications

    func cancelNotifications(for step: Step) {
        let identifiers = step.notificationIDs
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: identifiers)
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: identifiers)
    }

    func cancelAllNotifications(for goal: Goal) {
        let allIDs = goal.steps.flatMap { $0.notificationIDs }
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: allIDs)
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: allIDs)
    }

    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }

    // MARK: - Copy Generation

    private func checkInTitle(for step: Step, escalationLevel: Int) -> String {
        return "⚡️ Hardflip Check-In"
    }

    private func checkInBody(for step: Step, goal: Goal, escalationLevel: Int) -> String {
        let checkIns = [
            "Time's up. Did you finish: \(step.title)?",
            "Still working on \"\(step.title)\"? Clock's running.",
            "Check-in: \(step.title) — done or not?",
            "Where are you on \"\(step.title)\"? Be honest.",
            "\(goal.title) won't do itself. \(step.title) — done?"
        ]
        return checkIns.randomElement() ?? checkIns[0]
    }

    private func escalationTitle(level: Int) -> String {
        switch level {
        case 0: return "⚠️ Still waiting."
        case 1: return "🔥 Don't you dare quit."
        case 2: return "🚨 HARDFLIP ALERT"
        default: return "🚨 STILL HERE. STILL WAITING."
        }
    }

    private func escalationBody(for step: Step, goal: Goal, level: Int) -> String {
        switch level {
        case 0:
            return "You ignored the last check-in. \(step.title) — did you do it?"
        case 1:
            return "This is your second notice. \"\(goal.title)\" is slipping. Tap to check in."
        case 2:
            return "You set this goal. You don't get to ghost it. \(step.title). Now."
        default:
            return "We're still here. Your goal is still here. Are YOU still here?"
        }
    }

    // MARK: - Badge Management

    func updateBadgeCount() {
        Task {
            let requests = await UNUserNotificationCenter.current().pendingNotificationRequests()
            pendingNotificationCount = requests.count
            await MainActor.run {
                UNUserNotificationCenter.current().setBadgeCount(requests.count) { _ in }
            }
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationManager: UNUserNotificationCenterDelegate {

    // Handle notification when app is in foreground
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    // Handle notification tap / action
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        guard let goalIDString = userInfo["goalID"] as? String,
              let stepIDString = userInfo["stepID"] as? String,
              let goalID = UUID(uuidString: goalIDString),
              let stepID = UUID(uuidString: stepIDString) else {
            completionHandler()
            return
        }

        let actionID = response.actionIdentifier

        Task { @MainActor in
            switch actionID {
            case NotificationManager.actionDone:
                GoalStore.shared.markStepCompleted(goalID: goalID, stepID: stepID)
                EscalationEngine.shared.cancelEscalations(goalID: goalID, stepID: stepID)

            case NotificationManager.actionNotYet:
                // Schedule an escalation in 10 minutes
                if let goal = GoalStore.shared.goal(for: goalID),
                   let step = goal.steps.first(where: { $0.id == stepID }) {
                    await EscalationEngine.shared.triggerEscalation(for: step, in: goal)
                }

            case NotificationManager.actionSkip:
                GoalStore.shared.markStepSkipped(goalID: goalID, stepID: stepID)
                EscalationEngine.shared.cancelEscalations(goalID: goalID, stepID: stepID)

            default:
                // Tapped the notification itself — just open the app
                break
            }

            // Post a notification so the UI can respond
            NotificationCenter.default.post(
                name: .hardflipNotificationReceived,
                object: nil,
                userInfo: ["goalID": goalID, "stepID": stepID, "action": actionID]
            )
        }

        completionHandler()
    }
}

// MARK: - NSNotification Extension

extension Notification.Name {
    static let hardflipNotificationReceived = Notification.Name("hardflip.notificationReceived")
}
