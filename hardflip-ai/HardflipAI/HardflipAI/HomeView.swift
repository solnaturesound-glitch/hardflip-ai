import SwiftUI

// MARK: - HomeView
// Main screen: goal input + active goal cards.

struct HomeView: View {

    @EnvironmentObject var goalStore: GoalStore
    @EnvironmentObject var notificationManager: NotificationManager

    @State private var goalInput = ""
    @State private var isGenerating = false
    @State private var errorMessage: String?
    @State private var showError = false
    @State private var selectedGoal: Goal?
    @State private var showGoalDetail = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Spacing.lg) {

                        // Header
                        headerSection

                        // Input card
                        inputSection

                        // Error message
                        if showError, let error = errorMessage {
                            ErrorBanner(message: error) {
                                showError = false
                            }
                        }

                        // Active goals
                        if !goalStore.activeGoals.isEmpty {
                            activeGoalsSection
                        } else if !isGenerating {
                            emptyStateSection
                        }

                        // Padding at bottom
                        Color.clear.frame(height: Theme.Spacing.xl)
                    }
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.top, Theme.Spacing.sm)
                }
            }
            .navigationTitle("Hardflip AI")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("HARDFLIP AI")
                        .font(Theme.Typography.heading3)
                        .foregroundColor(Theme.Colors.primary)
                        .tracking(2)
                }
            }
            .navigationDestination(isPresented: $showGoalDetail) {
                if let goal = selectedGoal {
                    GoalDetailView(goalID: goal.id)
                }
            }
        }
        .onTapGesture {
            inputFocused = false
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
            Text("What do you\nwant to do?")
                .font(Theme.Typography.displaySmall)
                .foregroundColor(Theme.Colors.primary)
                .lineSpacing(2)
        }
        .padding(.top, Theme.Spacing.md)
    }

    // MARK: - Input

    private var inputSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            // Text field
            HStack(alignment: .center, spacing: Theme.Spacing.sm) {
                TextField("e.g. plant a tree, fix my resume...", text: $goalInput, axis: .vertical)
                    .font(Theme.Typography.bodyLarge)
                    .foregroundColor(Theme.Colors.primary)
                    .tint(Theme.Colors.accent)
                    .focused($inputFocused)
                    .lineLimit(3)
                    .onSubmit {
                        if !goalInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            Task { await createGoal() }
                        }
                    }

                if !goalInput.isEmpty {
                    Button {
                        goalInput = ""
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Theme.Colors.muted)
                            .font(.system(size: 20))
                    }
                }
            }
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.inputBackground)
            .cornerRadius(Theme.Radius.md)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.md)
                    .stroke(inputFocused ? Theme.Colors.primary.opacity(0.4) : Theme.Colors.border, lineWidth: 1)
            )

            // Go button
            Button {
                Task { await createGoal() }
            } label: {
                HStack(spacing: Theme.Spacing.sm) {
                    if isGenerating {
                        ProgressView()
                            .tint(.black)
                            .scaleEffect(0.8)
                        Text("Building your plan...")
                    } else {
                        Image(systemName: "bolt.fill")
                        Text("Lock It In")
                    }
                }
            }
            .buttonStyle(HardflipButtonStyle(variant: .primary))
            .disabled(goalInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isGenerating)
        }
    }

    // MARK: - Active Goals

    private var activeGoalsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text("IN PROGRESS")
                    .font(Theme.Typography.label)
                    .foregroundColor(Theme.Colors.secondary)
                    .tracking(1.5)

                Spacer()

                Text("\(goalStore.activeGoals.count)")
                    .font(Theme.Typography.label)
                    .foregroundColor(Theme.Colors.accent)
            }
            .padding(.top, Theme.Spacing.sm)

            ForEach(goalStore.activeGoals) { goal in
                GoalCard(goal: goal)
                    .onTapGesture {
                        selectedGoal = goal
                        showGoalDetail = true
                    }
            }
        }
    }

    // MARK: - Empty State

    private var emptyStateSection: some View {
        VStack(spacing: Theme.Spacing.md) {
            Spacer(minLength: Theme.Spacing.xxl)

            Image(systemName: "bolt.circle")
                .font(.system(size: 56))
                .foregroundColor(Theme.Colors.muted)

            Text("No active goals.")
                .font(Theme.Typography.heading2)
                .foregroundColor(Theme.Colors.secondary)

            Text("Stop thinking.\nType something above and hit Lock It In.")
                .font(Theme.Typography.body)
                .foregroundColor(Theme.Colors.muted)
                .multilineTextAlignment(.center)
                .lineSpacing(4)

            Spacer(minLength: Theme.Spacing.xxl)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Theme.Spacing.xl)
    }

    // MARK: - Goal Creation

    private func createGoal() async {
        let trimmed = goalInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        inputFocused = false
        isGenerating = true
        showError = false

        do {
            let steps: [Step]
            let apiKey = UserDefaults.standard.string(forKey: "hardflip.openai_api_key") ?? ""

            if apiKey.isEmpty {
                // Demo mode
                steps = GoalEngine.shared.generateFallbackSteps(for: trimmed)
            } else {
                steps = try await GoalEngine.shared.generateSteps(for: trimmed)
            }

            var goal = Goal(title: trimmed.capitalized, rawInput: trimmed)
            goal.steps = steps

            // Schedule notifications
            if notificationManager.permissionGranted {
                let notifMap = await NotificationManager.shared.scheduleAllSteps(for: goal)
                for (stepIDStr, notifIDs) in notifMap {
                    if let stepID = UUID(uuidString: stepIDStr),
                       let stepIndex = goal.steps.firstIndex(where: { $0.id == stepID }) {
                        goal.steps[stepIndex].notificationIDs = notifIDs
                    }
                }
            }

            goalStore.addGoal(goal)
            goalInput = ""

            // Open goal detail automatically
            selectedGoal = goal
            showGoalDetail = true

        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }

        isGenerating = false
    }
}

// MARK: - Goal Card

struct GoalCard: View {

    let goal: Goal
    @State private var appeared = false

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {

            // Title row
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text(goal.title)
                        .font(Theme.Typography.heading3)
                        .foregroundColor(Theme.Colors.primary)
                        .lineLimit(2)

                    if let currentStep = goal.currentStep {
                        Text("NOW: \(currentStep.title)")
                            .font(Theme.Typography.label)
                            .foregroundColor(Theme.Colors.accent)
                            .tracking(0.5)
                            .lineLimit(1)
                    }
                }

                Spacer()

                // Status badge
                StatusBadge(status: goal.status)
            }

            // Progress bar
            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(Theme.Colors.border)
                            .frame(height: 4)

                        RoundedRectangle(cornerRadius: 2)
                            .fill(progressColor)
                            .frame(width: geo.size.width * goal.progressFraction, height: 4)
                            .animation(Theme.Animation.spring, value: goal.progressFraction)
                    }
                }
                .frame(height: 4)

                HStack {
                    Text("\(goal.completedStepsCount)/\(goal.steps.count) steps")
                        .font(Theme.Typography.labelSmall)
                        .foregroundColor(Theme.Colors.secondary)

                    Spacer()

                    Text("\(Int(goal.progressFraction * 100))%")
                        .font(Theme.Typography.labelSmall)
                        .foregroundColor(Theme.Colors.secondary)
                }
            }

            // Next check-in time
            if let nextStep = goal.nextPendingStep, let scheduled = nextStep.scheduledAt {
                HStack(spacing: Theme.Spacing.xs) {
                    Image(systemName: "clock.fill")
                        .font(.system(size: 10))
                        .foregroundColor(Theme.Colors.muted)
                    Text("Check-in: ")
                        .font(Theme.Typography.bodySmall)
                        .foregroundColor(Theme.Colors.muted)
                    Text(scheduled, style: .relative)
                        .font(Theme.Typography.bodySmall)
                        .foregroundColor(Theme.Colors.secondary)
                }
            }
        }
        .padding(Theme.Spacing.md)
        .hardflipCard()
        .scaleEffect(appeared ? 1 : 0.95)
        .opacity(appeared ? 1 : 0)
        .onAppear {
            withAnimation(Theme.Animation.spring.delay(0.05)) {
                appeared = true
            }
        }
    }

    private var progressColor: Color {
        if goal.progressFraction < 0.3 { return Theme.Colors.accent }
        if goal.progressFraction < 0.7 { return Theme.Colors.accentWarm }
        return Theme.Colors.accentGreen
    }
}

// MARK: - Status Badge

struct StatusBadge: View {

    let status: GoalStatus

    var body: some View {
        Text(label)
            .font(Theme.Typography.labelSmall)
            .foregroundColor(color)
            .padding(.horizontal, Theme.Spacing.sm)
            .padding(.vertical, Theme.Spacing.xs)
            .background(color.opacity(0.15))
            .cornerRadius(Theme.Radius.pill)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.pill)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
    }

    private var label: String {
        switch status {
        case .active: return "ACTIVE"
        case .paused: return "PAUSED"
        case .completed: return "DONE"
        case .abandoned: return "DROPPED"
        }
    }

    private var color: Color {
        switch status {
        case .active: return Theme.Colors.accent
        case .paused: return Theme.Colors.warning
        case .completed: return Theme.Colors.accentGreen
        case .abandoned: return Theme.Colors.muted
        }
    }
}

// MARK: - Error Banner

struct ErrorBanner: View {

    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(Theme.Colors.warning)

            Text(message)
                .font(Theme.Typography.bodySmall)
                .foregroundColor(Theme.Colors.primary)
                .lineLimit(3)

            Spacer()

            Button { onDismiss() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Theme.Colors.secondary)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.warning.opacity(0.1))
        .cornerRadius(Theme.Radius.md)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.md)
                .stroke(Theme.Colors.warning.opacity(0.3), lineWidth: 1)
        )
    }
}

#Preview {
    HomeView()
        .environmentObject(GoalStore.shared)
        .environmentObject(NotificationManager.shared)
}
