import Foundation

// MARK: - Goal Status
enum GoalStatus: String, Codable, CaseIterable {
    case active = "active"
    case paused = "paused"
    case completed = "completed"
    case abandoned = "abandoned"
}

// MARK: - Step Status
enum StepStatus: String, Codable, CaseIterable {
    case pending = "pending"
    case inProgress = "inProgress"
    case completed = "completed"
    case skipped = "skipped"
}

// MARK: - CheckIn Response
enum CheckInResponse: String, Codable {
    case done = "done"
    case notYet = "notYet"
    case skipped = "skipped"
    case ignored = "ignored"
}

// MARK: - Step Model
struct Step: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var title: String
    var description: String
    var estimatedMinutes: Int
    var status: StepStatus = .pending
    var scheduledAt: Date?
    var completedAt: Date?
    var notificationIDs: [String] = []
    var escalationLevel: Int = 0 // 0 = first check-in, 1 = first escalation, 2 = second escalation, etc.

    var isOverdue: Bool {
        guard let scheduled = scheduledAt, status != .completed else { return false }
        return Date() > scheduled
    }

    var formattedDuration: String {
        if estimatedMinutes < 60 {
            return "\(estimatedMinutes) min"
        } else {
            let hours = estimatedMinutes / 60
            let mins = estimatedMinutes % 60
            return mins > 0 ? "\(hours)h \(mins)m" : "\(hours)h"
        }
    }
}

// MARK: - CheckIn Model
struct CheckIn: Identifiable, Codable {
    var id: UUID = UUID()
    var stepID: UUID
    var message: String
    var sentAt: Date
    var respondedAt: Date?
    var response: CheckInResponse?
    var escalationLevel: Int = 0
}

// MARK: - Goal Model
struct Goal: Identifiable, Codable, Equatable {
    var id: UUID = UUID()
    var title: String
    var rawInput: String
    var steps: [Step] = []
    var checkIns: [CheckIn] = []
    var status: GoalStatus = .active
    var createdAt: Date = Date()
    var completedAt: Date?
    var currentStepIndex: Int = 0

    var progressFraction: Double {
        guard !steps.isEmpty else { return 0 }
        let completed = steps.filter { $0.status == .completed }.count
        return Double(completed) / Double(steps.count)
    }

    var currentStep: Step? {
        guard currentStepIndex < steps.count else { return nil }
        return steps[currentStepIndex]
    }

    var nextPendingStep: Step? {
        return steps.first { $0.status == .pending || $0.status == .inProgress }
    }

    var completedStepsCount: Int {
        return steps.filter { $0.status == .completed }.count
    }

    var isComplete: Bool {
        return steps.allSatisfy { $0.status == .completed || $0.status == .skipped }
    }

    var estimatedTotalMinutes: Int {
        return steps.reduce(0) { $0 + $1.estimatedMinutes }
    }
}
