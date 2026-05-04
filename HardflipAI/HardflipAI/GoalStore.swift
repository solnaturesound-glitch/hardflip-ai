import Foundation
import Combine

// MARK: - GoalStore
// Persists goals and steps using UserDefaults with JSON encoding.
// Acts as the single source of truth for all goal data.

@MainActor
final class GoalStore: ObservableObject {

    static let shared = GoalStore()

    @Published private(set) var goals: [Goal] = []
    @Published private(set) var activeGoals: [Goal] = []
    @Published private(set) var completedGoals: [Goal] = []

    private let storageKey = "hardflip.goals.v1"
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private init() {
        load()
    }

    // MARK: - CRUD

    func addGoal(_ goal: Goal) {
        goals.insert(goal, at: 0)
        save()
        updateDerivedCollections()
    }

    func updateGoal(_ goal: Goal) {
        guard let index = goals.firstIndex(where: { $0.id == goal.id }) else { return }
        goals[index] = goal
        save()
        updateDerivedCollections()
    }

    func deleteGoal(id: UUID) {
        goals.removeAll { $0.id == id }
        save()
        updateDerivedCollections()
    }

    func goal(for id: UUID) -> Goal? {
        return goals.first { $0.id == id }
    }

    // MARK: - Step Management

    func markStepCompleted(goalID: UUID, stepID: UUID) {
        guard var goal = goal(for: goalID),
              let stepIndex = goal.steps.firstIndex(where: { $0.id == stepID }) else { return }

        goal.steps[stepIndex].status = .completed
        goal.steps[stepIndex].completedAt = Date()

        // Advance to next step
        let nextIndex = goal.steps.indices.first(where: { i in
            goal.steps[i].status == .pending && i > stepIndex
        })
        if let next = nextIndex {
            goal.currentStepIndex = next
            goal.steps[next].status = .inProgress
        }

        // Check if goal is complete
        if goal.isComplete {
            goal.status = .completed
            goal.completedAt = Date()
        }

        updateGoal(goal)
    }

    func markStepSkipped(goalID: UUID, stepID: UUID) {
        guard var goal = goal(for: goalID),
              let stepIndex = goal.steps.firstIndex(where: { $0.id == stepID }) else { return }

        goal.steps[stepIndex].status = .skipped

        // Advance to next step
        let nextIndex = goal.steps.indices.first(where: { i in
            goal.steps[i].status == .pending && i > stepIndex
        })
        if let next = nextIndex {
            goal.currentStepIndex = next
            goal.steps[next].status = .inProgress
        }

        if goal.isComplete {
            goal.status = .completed
            goal.completedAt = Date()
        }

        updateGoal(goal)
    }

    func addCheckIn(_ checkIn: CheckIn, to goalID: UUID) {
        guard var goal = goal(for: goalID) else { return }
        goal.checkIns.append(checkIn)
        updateGoal(goal)
    }

    func recordCheckInResponse(goalID: UUID, checkInID: UUID, response: CheckInResponse) {
        guard var goal = goal(for: goalID),
              let checkInIndex = goal.checkIns.firstIndex(where: { $0.id == checkInID }) else { return }

        goal.checkIns[checkInIndex].response = response
        goal.checkIns[checkInIndex].respondedAt = Date()

        if response == .done {
            markStepCompleted(goalID: goalID, stepID: goal.checkIns[checkInIndex].stepID)
        }

        updateGoal(goal)
    }

    func updateStepNotificationIDs(goalID: UUID, stepID: UUID, notificationIDs: [String]) {
        guard var goal = goal(for: goalID),
              let stepIndex = goal.steps.firstIndex(where: { $0.id == stepID }) else { return }
        goal.steps[stepIndex].notificationIDs = notificationIDs
        updateGoal(goal)
    }

    // MARK: - Persistence

    private func save() {
        do {
            let data = try encoder.encode(goals)
            UserDefaults.standard.set(data, forKey: storageKey)
        } catch {
            print("GoalStore: Failed to save goals — \(error)")
        }
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey) else {
            goals = []
            return
        }
        do {
            goals = try decoder.decode([Goal].self, from: data)
        } catch {
            print("GoalStore: Failed to load goals — \(error)")
            goals = []
        }
        updateDerivedCollections()
    }

    private func updateDerivedCollections() {
        activeGoals = goals.filter { $0.status == .active || $0.status == .paused }
        completedGoals = goals.filter { $0.status == .completed }
    }

    // MARK: - Debug

    func clearAll() {
        goals = []
        UserDefaults.standard.removeObject(forKey: storageKey)
        updateDerivedCollections()
    }
}
