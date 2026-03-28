import SwiftUI

// MARK: - OnboardingView
// 3-screen dark onboarding flow. Bold, aggressive, no-BS brand intro.

struct OnboardingView: View {

    @Binding var isPresented: Bool
    @AppStorage("hardflip.onboarding_complete") private var onboardingComplete = false
    @AppStorage("hardflip.notifications_requested") private var notificationsRequested = false

    @State private var currentPage = 0
    @State private var requestingPermission = false

    private let pages: [OnboardingPage] = [
        OnboardingPage(
            id: 0,
            headline: "You quit. Every time.",
            subheadline: "You set the goal. You fired it up. And then life happened — and you let it.",
            body: "Not this time.",
            icon: "flame.fill",
            iconColor: Theme.Colors.accent
        ),
        OnboardingPage(
            id: 1,
            headline: "We break it down.",
            subheadline: "Tell us what you want to do. We turn it into concrete, timed steps. No ambiguity. No wiggle room.",
            body: "Real steps. Real deadlines.",
            icon: "list.bullet.clipboard.fill",
            iconColor: Theme.Colors.primary
        ),
        OnboardingPage(
            id: 2,
            headline: "We don't let you quit.",
            subheadline: "If you ignore a check-in, we escalate. If you go silent, we get louder. We keep pushing until it's done.",
            body: "Ready to stop quitting?",
            icon: "bolt.fill",
            iconColor: Theme.Colors.accentWarm
        )
    ]

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Page content
                TabView(selection: $currentPage) {
                    ForEach(pages) { page in
                        OnboardingPageView(page: page)
                            .tag(page.id)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(Theme.Animation.spring, value: currentPage)

                // Bottom controls
                VStack(spacing: Theme.Spacing.md) {
                    // Page indicators
                    HStack(spacing: Theme.Spacing.sm) {
                        ForEach(pages) { page in
                            RoundedRectangle(cornerRadius: Theme.Radius.pill)
                                .fill(currentPage == page.id ? Color.white : Theme.Colors.muted)
                                .frame(width: currentPage == page.id ? 24 : 8, height: 8)
                                .animation(Theme.Animation.snappy, value: currentPage)
                        }
                    }
                    .padding(.bottom, Theme.Spacing.sm)

                    // CTA Button
                    Button(ctaLabel) {
                        handleCTA()
                    }
                    .buttonStyle(HardflipButtonStyle(variant: .primary))
                    .padding(.horizontal, Theme.Spacing.lg)
                    .disabled(requestingPermission)
                    .overlay {
                        if requestingPermission {
                            ProgressView()
                                .tint(.black)
                        }
                    }

                    // Skip / secondary action
                    if currentPage < pages.count - 1 {
                        Button("Skip intro") {
                            withAnimation(Theme.Animation.spring) {
                                currentPage = pages.count - 1
                            }
                        }
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.secondary)
                    }
                }
                .padding(.bottom, Theme.Spacing.xl)
                .padding(.horizontal, Theme.Spacing.md)
            }
        }
    }

    private var ctaLabel: String {
        switch currentPage {
        case 0: return "Let's go →"
        case 1: return "Keep going →"
        default: return "Get Started. No excuses."
        }
    }

    private func handleCTA() {
        if currentPage < pages.count - 1 {
            withAnimation(Theme.Animation.spring) {
                currentPage += 1
            }
        } else {
            // Last page — request notifications then complete onboarding
            requestingPermission = true
            Task {
                if !notificationsRequested {
                    _ = await NotificationManager.shared.requestPermission()
                    notificationsRequested = true
                }
                await MainActor.run {
                    requestingPermission = false
                    withAnimation(Theme.Animation.spring) {
                        onboardingComplete = true
                    }
                }
            }
        }
    }
}

// MARK: - Onboarding Page Data

struct OnboardingPage: Identifiable {
    let id: Int
    let headline: String
    let subheadline: String
    let body: String
    let icon: String
    let iconColor: Color
}

// MARK: - Onboarding Page View

struct OnboardingPageView: View {

    let page: OnboardingPage

    @State private var appeared = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            // Icon
            ZStack {
                Circle()
                    .fill(page.iconColor.opacity(0.1))
                    .frame(width: 120, height: 120)
                    .overlay(
                        Circle()
                            .stroke(page.iconColor.opacity(0.3), lineWidth: 1.5)
                    )
                Image(systemName: page.icon)
                    .font(.system(size: 52, weight: .bold))
                    .foregroundColor(page.iconColor)
            }
            .scaleEffect(appeared ? 1 : 0.5)
            .opacity(appeared ? 1 : 0)
            .padding(.bottom, Theme.Spacing.xl)

            // Headline
            Text(page.headline)
                .font(Theme.Typography.displaySmall)
                .foregroundColor(Theme.Colors.primary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Theme.Spacing.lg)
                .offset(y: appeared ? 0 : 30)
                .opacity(appeared ? 1 : 0)
                .padding(.bottom, Theme.Spacing.md)

            // Subheadline
            Text(page.subheadline)
                .font(Theme.Typography.bodyLarge)
                .foregroundColor(Theme.Colors.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
                .padding(.horizontal, Theme.Spacing.xl)
                .offset(y: appeared ? 0 : 20)
                .opacity(appeared ? 1 : 0)
                .padding(.bottom, Theme.Spacing.lg)

            // Bottom emphasis line
            Text(page.body)
                .font(Theme.Typography.heading2)
                .foregroundColor(Theme.Colors.primary)
                .multilineTextAlignment(.center)
                .offset(y: appeared ? 0 : 15)
                .opacity(appeared ? 1 : 0)

            Spacer()
            Spacer()
        }
        .onAppear {
            withAnimation(Theme.Animation.spring.delay(0.1)) {
                appeared = true
            }
        }
        .onDisappear {
            appeared = false
        }
    }
}

#Preview {
    OnboardingView(isPresented: .constant(true))
}
