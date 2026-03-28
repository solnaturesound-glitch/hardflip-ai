import Foundation
import Combine

// MARK: - EscalationEngine
// Tracks which steps haven't been responded to and fires escalating reminders.
// Escalation schedule: 10 min → 20 min → 30 min → hourly until responded.

@MainActor
final class EscalationEngine: ObservableObject {

    static let shared = EscalationEngine()

    // Active escalation timers keyed by "goalID-stepID"
    private var escalationTimers: [String: Task<Void, Never>] = [:]

    // Escalation delays in minutes — each level waits longer
    private let escalationDelays = [10, 20, 45, 60, 60]
    private let maxEscalationLevel = 4

    private init() {}

    // MARK: - Start Escalation Watch

    /// Begin watching a step for response. Call this when a check-in notification fires.
    func startWatching(step: Step, in goal: Goal) {
        let key = escalationKey(goalID: goal.id, stepID: step.id)

        // Cancel any existing escalation for this step
        escalationTimers[key]?.cancel()

        // Start fresh escalation chain
        escalationTimers[key] = Task {
            await runEscalationChain(for: step, in: goal, level: 0)
        }
    }

    /// Run a full escalation chain starting from the given level.
    private func runEscalationChain(for step: Step, in goal: Goal, level: Int) async {
        guard level <= maxEscalationLevel else {
            print("EscalationEngine: Max escalation level reached for step \(step.title)")
            return
        }

        let delayMinutes = escalationDelays[min(level, escalationDelays.count - 1)]
        let delaySeconds = TimeInterval(delayMinutes * 60)

        do {
            try await Task.sleep(for: .seconds(delaySeconds))
        } catch {
            // Task was cancelled — step was completed or goal was abandoned
            return
        }

        // Check if step still needs escalation
        guard let currentGoal = GoalStore.shared.goal(for: goal.id),
              let currentStep = currentGoal.steps.first(where: { $0.id == step.id }),
              currentStep.status != .completed && currentStep.status != .skipped else {
            return
        }

        // Fire escalation notification
        await NotificationManager.shared.scheduleEscalation(
            for: currentStep,
            in: currentGoal,
            escalationLevel: level,
            delayMinutes: 0 // Fire immediately — we already waited
        )

        // Record the escalation as a check-in
        let checkIn = CheckIn(
            id: UUID(),
            stepID: step.id,
            message: escalationMessage(level: level, step: step, goal: goal),
            sentAt: Date(),
            escalationLevel: level
        )
        GoalStore.shared.addCheckIn(checkIn, to: goal.id)

        // Schedule next escalation level
        await runEscalationChain(for: step, in: goal, level: level + 1)
    }

    // MARK: - Trigger Manual Escalation

    /// Immediately trigger an escalation (e.g., user tapped "Not Yet").
    func triggerEscalation(for step: Step, in goal: Goal) async {
        let currentLevel = currentEscalationLevel(for: step.id, in: goal)

        await NotificationManager.shared.scheduleEscalation(
            for: step,
            in: goal,
            escalationLevel: currentLevel,
            delayMinutes: 5
        )

        let checkIn = CheckIn(
            id: UUID(),
            stepID: step.id,
            message: escalationMessage(level: currentLevel, step: step, goal: goal),
            sentAt: Date(),
            escalationLevel: currentLevel
        )
        GoalStore.shared.addCheckIn(checkIn, to: goal.id)
    }

    // MARK: - Cancel Escalations

    func cancelEscalations(goalID: UUID, stepID: UUID) {
        let key = escalationKey(goalID: goalID, stepID: stepID)
        escalationTimers[key]?.cancel()
        escalationTimers.removeValue(forKey: key)
    }

    func cancelAllEscalations(for goal: Goal) {
        for step in goal.steps {
            cancelEscalations(goalID: goal.id, stepID: step.id)
        }
    }

    // MARK: - Helpers

    private func escalationKey(goalID: UUID, stepID: UUID) -> String {
        return "\(goalID)-\(stepID)"
    }

    private func currentEscalationLevel(for stepID: UUID, in goal: Goal) -> Int {
        let stepCheckIns = goal.checkIns.filter { $0.stepID == stepID }
        return stepCheckIns.map { $0.escalationLevel }.max().map { $0 + 1 } ?? 0
    }

    private func escalationMessage(level: Int, step: Step, goal: Goal) -> String {
        switch level {
        case 0:
            return "Still waiting on you. Did you finish: \(step.title)?"
        case 1:
            return "That's twice now. \"\(goal.title)\" is on the line. \(step.title) — go."
        case 2:
            return "Three check-ins. Three times you haven't responded. Don't let this die."
        case 3:
            return "You're ghosting your own goals. Wake up. \(step.title). Now."
        default:
            return "We're not giving up on \"\(goal.title)\". Neither should you."
        }
    }

    // MARK: - Status

    var activeEscalationCount: Int {
        return escalationTimers.values.filter { !$0.isCancelled }.count
    }
}

// MARK: - Task+isCancelled
extension Task {
    var isCancelled: Bool {
        return checkCancellation() == nil ? false : true
    }

    private func checkCancellation() -> Never? {
        return nil
    }
}
