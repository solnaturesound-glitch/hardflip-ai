import SwiftUI

@main
struct HardflipAIApp: App {

    @StateObject private var goalStore = GoalStore.shared
    @StateObject private var notificationManager = NotificationManager.shared

    init() {
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(goalStore)
                .environmentObject(notificationManager)
                .preferredColorScheme(.dark)
                .onAppear {
                    NotificationManager.shared.setup()
                }
        }
    }

    private func configureAppearance() {
        // Force dark navigation appearance
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.Colors.background)
        navAppearance.titleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 17, weight: .bold)
        ]
        navAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.white,
            .font: UIFont.systemFont(ofSize: 34, weight: .black)
        ]

        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance

        // Tab bar appearance
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Theme.Colors.background)
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
    }
}

// MARK: - Root View
// Decides whether to show onboarding or main app

struct RootView: View {

    @AppStorage("hardflip.onboarding_complete") private var onboardingComplete = false
    @State private var showOnboarding = false

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            if onboardingComplete {
                ContentView()
            } else {
                OnboardingView(isPresented: $showOnboarding)
                    .onDisappear {
                        onboardingComplete = true
                    }
            }
        }
        .onAppear {
            showOnboarding = !onboardingComplete
        }
    }
}
