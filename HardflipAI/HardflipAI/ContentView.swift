import SwiftUI

// MARK: - ContentView
// Root navigation shell. Houses the main tab bar.

struct ContentView: View {

    @EnvironmentObject var goalStore: GoalStore
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Goals", systemImage: "bolt.fill")
                }
                .tag(0)

            HistoryView()
                .tabItem {
                    Label("History", systemImage: "checkmark.circle.fill")
                }
                .tag(1)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
                .tag(2)
        }
        .accentColor(.white)
        .background(Theme.Colors.background)
        .onReceive(NotificationCenter.default.publisher(for: .hardflipNotificationReceived)) { notification in
            // When a notification is received, switch to Goals tab
            selectedTab = 0
        }
    }
}

// MARK: - History View

struct HistoryView: View {

    @EnvironmentObject var goalStore: GoalStore

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                if goalStore.completedGoals.isEmpty {
                    VStack(spacing: Theme.Spacing.md) {
                        Image(systemName: "checkmark.circle")
                            .font(.system(size: 64))
                            .foregroundColor(Theme.Colors.muted)
                        Text("Nothing done yet.")
                            .font(Theme.Typography.heading2)
                            .foregroundColor(Theme.Colors.primary)
                        Text("Finish a goal and it shows up here.")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.secondary)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.sm) {
                            ForEach(goalStore.completedGoals) { goal in
                                CompletedGoalCard(goal: goal)
                            }
                        }
                        .padding(.horizontal, Theme.Spacing.md)
                        .padding(.top, Theme.Spacing.md)
                    }
                }
            }
            .navigationTitle("Wins")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

// MARK: - Completed Goal Card

struct CompletedGoalCard: View {

    let goal: Goal

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(Theme.Colors.accentGreen)
                Text(goal.title)
                    .font(Theme.Typography.heading3)
                    .foregroundColor(Theme.Colors.primary)
                    .lineLimit(2)
                Spacer()
            }

            HStack(spacing: Theme.Spacing.sm) {
                Text("\(goal.steps.count) steps")
                    .font(Theme.Typography.bodySmall)
                    .foregroundColor(Theme.Colors.secondary)

                Text("•")
                    .foregroundColor(Theme.Colors.muted)

                if let completedAt = goal.completedAt {
                    Text(completedAt, style: .date)
                        .font(Theme.Typography.bodySmall)
                        .foregroundColor(Theme.Colors.secondary)
                }
            }
        }
        .padding(Theme.Spacing.md)
        .hardflipCard()
    }
}

// MARK: - Settings View

struct SettingsView: View {

    @AppStorage("hardflip.openai_api_key") private var apiKey = ""
    @AppStorage("hardflip.onboarding_complete") private var onboardingComplete = true
    @EnvironmentObject var goalStore: GoalStore
    @State private var showClearAlert = false
    @State private var showKeyField = false
    @State private var tempKey = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                Form {
                    Section {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("OpenAI API Key")
                                    .font(Theme.Typography.body)
                                    .foregroundColor(Theme.Colors.primary)
                                Text(apiKey.isEmpty ? "Not set — app uses demo mode" : "Key configured ✓")
                                    .font(Theme.Typography.bodySmall)
                                    .foregroundColor(apiKey.isEmpty ? Theme.Colors.warning : Theme.Colors.accentGreen)
                            }
                            Spacer()
                            Button(apiKey.isEmpty ? "Add" : "Update") {
                                tempKey = apiKey
                                showKeyField = true
                            }
                            .font(Theme.Typography.label)
                            .foregroundColor(Theme.Colors.accent)
                        }
                    } header: {
                        Text("AI Engine")
                            .foregroundColor(Theme.Colors.secondary)
                    }
                    .listRowBackground(Theme.Colors.surfaceElevated)

                    Section {
                        Button("Reset Onboarding") {
                            onboardingComplete = false
                        }
                        .foregroundColor(Theme.Colors.warning)
                    } header: {
                        Text("Debug")
                            .foregroundColor(Theme.Colors.secondary)
                    }
                    .listRowBackground(Theme.Colors.surfaceElevated)

                    Section {
                        Button("Clear All Goals") {
                            showClearAlert = true
                        }
                        .foregroundColor(Theme.Colors.destructive)
                    } header: {
                        Text("Data")
                            .foregroundColor(Theme.Colors.secondary)
                    }
                    .listRowBackground(Theme.Colors.surfaceElevated)

                    Section {
                        VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                            Text("Hardflip AI")
                                .font(Theme.Typography.heading3)
                                .foregroundColor(Theme.Colors.primary)
                            Text("The AI That Won't Let You Quit.")
                                .font(Theme.Typography.bodySmall)
                                .foregroundColor(Theme.Colors.secondary)
                            Text("Version 1.0 MVP")
                                .font(Theme.Typography.bodySmall)
                                .foregroundColor(Theme.Colors.muted)
                        }
                        .padding(.vertical, Theme.Spacing.xs)
                    }
                    .listRowBackground(Theme.Colors.surfaceElevated)
                }
                .scrollContentBackground(.hidden)
                .background(Theme.Colors.background)
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
            .alert("Clear All Goals?", isPresented: $showClearAlert) {
                Button("Clear Everything", role: .destructive) {
                    goalStore.clearAll()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will delete all your goals and steps. This cannot be undone.")
            }
            .sheet(isPresented: $showKeyField) {
                APIKeySheet(apiKey: $apiKey, tempKey: $tempKey)
            }
        }
    }
}

// MARK: - API Key Sheet

struct APIKeySheet: View {

    @Binding var apiKey: String
    @Binding var tempKey: String
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                VStack(alignment: .leading, spacing: Theme.Spacing.lg) {
                    VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                        Text("OpenAI API Key")
                            .font(Theme.Typography.heading1)
                            .foregroundColor(Theme.Colors.primary)
                        Text("Get yours at platform.openai.com. Your key is stored locally and never leaves your device.")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.secondary)
                    }

                    SecureField("sk-...", text: $tempKey)
                        .font(Theme.Typography.mono)
                        .foregroundColor(Theme.Colors.primary)
                        .padding(Theme.Spacing.md)
                        .background(Theme.Colors.inputBackground)
                        .cornerRadius(Theme.Radius.md)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.Radius.md)
                                .stroke(Theme.Colors.border, lineWidth: 1)
                        )

                    Button("Save Key") {
                        apiKey = tempKey
                        dismiss()
                    }
                    .buttonStyle(HardflipButtonStyle(variant: .primary))
                    .disabled(tempKey.isEmpty)

                    Spacer()
                }
                .padding(Theme.Spacing.lg)
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(Theme.Colors.secondary)
                }
            }
        }
    }
}
