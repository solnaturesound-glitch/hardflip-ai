import SwiftUI

// MARK: - GoalDetailView
// Shows full goal breakdown: steps, current progress, check-in history, and inline response controls.

struct GoalDetailView: View {

    let goalID: UUID

    @EnvironmentObject var goalStore: GoalStore
    @Environment(\.dismiss) var dismiss

    @State private var showAbandonAlert = false
    @State private var expandedStepID: UUID?
    @State private var respondingCheckIn: CheckIn?

    private var goal: Goal? {
        goalStore.goal(for: goalID)
    }

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            if let goal = goal {
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Spacing.lg) {

                        // Progress header
                        progressHeader(goal: goal)

                        // Current step callout
                        if let current = goal.currentStep, goal.status == .active {
                            currentStepCallout(step: current, goal: goal)
                        }

                        // All steps
                        stepsSection(goal: goal)

                        // Check-in history
                        if !goal.checkIns.isEmpty {
                            checkInHistory(goal: goal)
                        }

                        // Abandon button
                        if goal.status == .active {
                            Button("Abandon this goal") {
                                showAbandonAlert = true
                            }
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.muted)
                            .frame(maxWidth: .infinity)
                            .padding(.top, Theme.Spacing.md)
                        }

                        Color.clear.frame(height: Theme.Spacing.xl)
                    }
                    .padding(.horizontal, Theme.Spacing.md)
                    .padding(.top, Theme.Spacing.sm)
                }
            } else {
                // Goal was deleted
                VStack(spacing: Theme.Spacing.md) {
                    Text("Goal not found.")
                        .font(Theme.Typography.heading2)
                        .foregroundColor(Theme.Colors.secondary)
                    Button("Go Back") { dismiss() }
                        .foregroundColor(Theme.Colors.accent)
                }
            }
        }
        .navigationTitle(goal?.title ?? "Goal")
        .navigationBarTitleDisplayMode(.inline)
        .navigationBarBackButtonHidden(false)
        .alert("Abandon Goal?", isPresented: $showAbandonAlert) {
            Button("Abandon", role: .destructive) {
                if var g = goal {
                    NotificationManager.shared.cancelAllNotifications(for: g)
                    EscalationEngine.shared.cancelAllEscalations(for: g)
                    g.status = .abandoned
                    goalStore.updateGoal(g)
                    dismiss()
                }
            }
            Button("Keep Going", role: .cancel) {}
        } message: {
            Text("Abandoning means it's over. Are you sure you want to quit?")
        }
        .onReceive(NotificationCenter.default.publisher(for: .hardflipNotificationReceived)) { notification in
            guard let gID = notification.userInfo?["goalID"] as? UUID,
                  gID == goalID else { return }
            // Refresh view — SwiftUI will pick up GoalStore changes automatically
        }
    }

    // MARK: - Progress Header

    private func progressHeader(goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            // Big progress ring / fraction
            HStack(alignment: .center, spacing: Theme.Spacing.lg) {
                // Circular progress
                ZStack {
                    Circle()
                        .stroke(Theme.Colors.border, lineWidth: 6)
                        .frame(width: 72, height: 72)

                    Circle()
                        .trim(from: 0, to: goal.progressFraction)
                        .stroke(progressColor(for: goal), style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .frame(width: 72, height: 72)
                        .rotationEffect(.degrees(-90))
                        .animation(Theme.Animation.spring, value: goal.progressFraction)

                    Text("\(Int(goal.progressFraction * 100))%")
                        .font(Theme.Typography.label)
                        .foregroundColor(Theme.Colors.primary)
                }

                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("\(goal.completedStepsCount) of \(goal.steps.count) steps done")
                        .font(Theme.Typography.heading3)
                        .foregroundColor(Theme.Colors.primary)

                    Text("Est. \(goal.estimatedTotalMinutes) min total")
                        .font(Theme.Typography.bodySmall)
                        .foregroundColor(Theme.Colors.secondary)

                    StatusBadge(status: goal.status)
                }
            }

            // Completion message
            if goal.status == .completed {
                HStack(spacing: Theme.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Theme.Colors.accentGreen)
                        .font(.system(size: 24))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("DONE. You actually did it.")
                            .font(Theme.Typography.heading3)
                            .foregroundColor(Theme.Colors.accentGreen)
                        if let completed = goal.completedAt {
                            Text("Completed \(completed, style: .relative) ago")
                                .font(Theme.Typography.bodySmall)
                                .foregroundColor(Theme.Colors.secondary)
                        }
                    }
                }
                .padding(Theme.Spacing.md)
                .background(Theme.Colors.accentGreen.opacity(0.1))
                .cornerRadius(Theme.Radius.md)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.Radius.md)
                        .stroke(Theme.Colors.accentGreen.opacity(0.3), lineWidth: 1)
                )
            }
        }
        .padding(Theme.Spacing.md)
        .hardflipCard()
    }

    // MARK: - Current Step Callout

    private func currentStepCallout(step: Step, goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Text("UP NEXT")
                    .font(Theme.Typography.label)
                    .foregroundColor(Theme.Colors.accent)
                    .tracking(1.5)
                Spacer()
                if let scheduled = step.scheduledAt {
                    HStack(spacing: Theme.Spacing.xs) {
                        Image(systemName: "clock")
                            .font(.system(size: 11))
                        Text("Check-in ")
                        Text(scheduled, style: .relative)
                    }
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.secondary)
                }
            }

            Text(step.title)
                .font(Theme.Typography.heading2)
                .foregroundColor(Theme.Colors.primary)

            Text(step.description)
                .font(Theme.Typography.body)
                .foregroundColor(Theme.Colors.secondary)
                .lineSpacing(3)

            HStack(spacing: Theme.Spacing.sm) {
                Text("⏱ \(step.formattedDuration)")
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.muted)
                Spacer()
            }

            // Mark done / skip buttons
            HStack(spacing: Theme.Spacing.sm) {
                Button {
                    withAnimation(Theme.Animation.spring) {
                        goalStore.markStepCompleted(goalID: goal.id, stepID: step.id)
                        NotificationManager.shared.cancelNotifications(for: step)
                        EscalationEngine.shared.cancelEscalations(goalID: goal.id, stepID: step.id)
                    }
                } label: {
                    HStack {
                        Image(systemName: "checkmark")
                        Text("Mark Done")
                    }
                }
                .buttonStyle(HardflipButtonStyle(variant: .primary))

                Button {
                    withAnimation(Theme.Animation.spring) {
                        goalStore.markStepSkipped(goalID: goal.id, stepID: step.id)
                        NotificationManager.shared.cancelNotifications(for: step)
                    }
                } label: {
                    Text("Skip")
                }
                .buttonStyle(HardflipButtonStyle(variant: .secondary))
                .frame(width: 80)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.accent.opacity(0.08))
        .cornerRadius(Theme.Radius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.Radius.lg)
                .stroke(Theme.Colors.accent.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Steps Section

    private func stepsSection(goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("ALL STEPS")
                .font(Theme.Typography.label)
                .foregroundColor(Theme.Colors.secondary)
                .tracking(1.5)

            ForEach(Array(goal.steps.enumerated()), id: \.element.id) { index, step in
                StepRow(
                    step: step,
                    index: index,
                    goal: goal,
                    isExpanded: expandedStepID == step.id
                ) {
                    withAnimation(Theme.Animation.spring) {
                        expandedStepID = expandedStepID == step.id ? nil : step.id
                    }
                } onMarkDone: {
                    goalStore.markStepCompleted(goalID: goal.id, stepID: step.id)
                    NotificationManager.shared.cancelNotifications(for: step)
                    EscalationEngine.shared.cancelEscalations(goalID: goal.id, stepID: step.id)
                } onSkip: {
                    goalStore.markStepSkipped(goalID: goal.id, stepID: step.id)
                }
            }
        }
    }

    // MARK: - Check-In History

    private func checkInHistory(goal: Goal) -> some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            Text("CHECK-IN LOG")
                .font(Theme.Typography.label)
                .foregroundColor(Theme.Colors.secondary)
                .tracking(1.5)

            ForEach(goal.checkIns.sorted(by: { $0.sentAt > $1.sentAt })) { checkIn in
                CheckInRow(checkIn: checkIn)
            }
        }
    }

    // MARK: - Helpers

    private func progressColor(for goal: Goal) -> Color {
        if goal.progressFraction < 0.3 { return Theme.Colors.accent }
        if goal.progressFraction < 0.7 { return Theme.Colors.accentWarm }
        return Theme.Colors.accentGreen
    }
}

// MARK: - Step Row

struct StepRow: View {

    let step: Step
    let index: Int
    let goal: Goal
    let isExpanded: Bool
    let onTap: () -> Void
    let onMarkDone: () -> Void
    let onSkip: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: onTap) {
                HStack(spacing: Theme.Spacing.sm) {
                    // Step number / status icon
                    ZStack {
                        Circle()
                            .fill(stepCircleColor)
                            .frame(width: 32, height: 32)
                        stepIcon
                    }

                    VStack(alignment: .leading, spacing: 2) {
                        Text(step.title)
                            .font(Theme.Typography.body)
                            .foregroundColor(stepTitleColor)
                            .lineLimit(isExpanded ? nil : 1)
                            .strikethrough(step.status == .completed || step.status == .skipped)

                        Text(step.formattedDuration)
                            .font(Theme.Typography.bodySmall)
                            .foregroundColor(Theme.Colors.muted)
                    }

                    Spacer()

                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(Theme.Colors.muted)
                }
                .padding(Theme.Spacing.md)
            }

            if isExpanded {
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Text(step.description)
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.secondary)
                        .lineSpacing(3)
                        .padding(.horizontal, Theme.Spacing.md)

                    if step.status == .pending || step.status == .inProgress {
                        HStack(spacing: Theme.Spacing.sm) {
                            Button {
                                withAnimation(Theme.Animation.spring) { onMarkDone() }
                            } label: {
                                HStack {
                                    Image(systemName: "checkmark")
                                    Text("Done")
                                }
                            }
                            .buttonStyle(HardflipButtonStyle(variant: .primary))

                            Button {
                                withAnimation(Theme.Animation.spring) { onSkip() }
                            } label: {
                                Text("Skip")
                            }
                            .buttonStyle(HardflipButtonStyle(variant: .ghost))
                        }
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.bottom, Theme.Spacing.md)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .hardflipCard()
    }

    private var stepCircleColor: Color {
        switch step.status {
        case .pending: return Theme.Colors.border
        case .inProgress: return Theme.Colors.accent.opacity(0.2)
        case .completed: return Theme.Colors.accentGreen.opacity(0.2)
        case .skipped: return Theme.Colors.muted.opacity(0.2)
        }
    }

    private var stepIcon: some View {
        Group {
            switch step.status {
            case .pending:
                Text("\(index + 1)")
                    .font(Theme.Typography.label)
                    .foregroundColor(Theme.Colors.muted)
            case .inProgress:
                Image(systemName: "bolt.fill")
                    .font(.system(size: 12))
                    .foregroundColor(Theme.Colors.accent)
            case .completed:
                Image(systemName: "checkmark")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(Theme.Colors.accentGreen)
            case .skipped:
                Image(systemName: "forward.fill")
                    .font(.system(size: 12))
                    .foregroundColor(Theme.Colors.muted)
            }
        }
    }

    private var stepTitleColor: Color {
        switch step.status {
        case .pending: return Theme.Colors.secondary
        case .inProgress: return Theme.Colors.primary
        case .completed: return Theme.Colors.muted
        case .skipped: return Theme.Colors.muted
        }
    }
}

// MARK: - Check-In Row

struct CheckInRow: View {

    let checkIn: CheckIn

    var body: some View {
        HStack(alignment: .top, spacing: Theme.Spacing.sm) {
            // Escalation indicator
            Circle()
                .fill(escalationColor)
                .frame(width: 8, height: 8)
                .padding(.top, 6)

            VStack(alignment: .leading, spacing: 2) {
                Text(checkIn.message)
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.secondary)
                    .lineSpacing(2)

                HStack(spacing: Theme.Spacing.xs) {
                    Text(checkIn.sentAt, style: .relative)
                        .font(Theme.Typography.labelSmall)
                        .foregroundColor(Theme.Colors.muted)

                    if let response = checkIn.response {
                        Text("•")
                            .foregroundColor(Theme.Colors.muted)
                        Text(responseLabel(response))
                            .font(Theme.Typography.labelSmall)
                            .foregroundColor(responseColor(response))
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, Theme.Spacing.xs)
    }

    private var escalationColor: Color {
        switch checkIn.escalationLevel {
        case 0: return Theme.Colors.secondary
        case 1: return Theme.Colors.warning
        default: return Theme.Colors.accent
        }
    }

    private func responseLabel(_ response: CheckInResponse) -> String {
        switch response {
        case .done: return "marked done"
        case .notYet: return "not yet"
        case .skipped: return "skipped"
        case .ignored: return "ignored"
        }
    }

    private func responseColor(_ response: CheckInResponse) -> Color {
        switch response {
        case .done: return Theme.Colors.accentGreen
        case .notYet: return Theme.Colors.warning
        case .skipped: return Theme.Colors.muted
        case .ignored: return Theme.Colors.accent
        }
    }
}
