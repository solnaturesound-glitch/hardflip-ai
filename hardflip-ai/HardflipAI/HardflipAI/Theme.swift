import SwiftUI

// MARK: - Hardflip AI Theme
enum Theme {

    // MARK: - Colors
    enum Colors {
        static let background = Color(hex: "#0A0A0A")
        static let surface = Color(hex: "#141414")
        static let surfaceElevated = Color(hex: "#1E1E1E")
        static let border = Color(hex: "#2A2A2A")

        static let primary = Color.white
        static let secondary = Color(hex: "#A0A0A0")
        static let muted = Color(hex: "#505050")

        static let accent = Color(hex: "#FF3B30")       // Aggressive red — urgency
        static let accentWarm = Color(hex: "#FF6B35")   // Orange — warning
        static let accentGreen = Color(hex: "#30D158")  // Success

        static let cardBackground = Color(hex: "#111111")
        static let inputBackground = Color(hex: "#1A1A1A")

        static let destructive = Color(hex: "#FF3B30")
        static let warning = Color(hex: "#FF9F0A")
        static let success = Color(hex: "#30D158")
    }

    // MARK: - Typography
    enum Typography {
        // Display — massive headlines
        static let displayLarge = Font.system(size: 48, weight: .black, design: .default)
        static let displayMedium = Font.system(size: 36, weight: .black, design: .default)
        static let displaySmall = Font.system(size: 28, weight: .heavy, design: .default)

        // Headings
        static let heading1 = Font.system(size: 24, weight: .bold, design: .default)
        static let heading2 = Font.system(size: 20, weight: .bold, design: .default)
        static let heading3 = Font.system(size: 17, weight: .semibold, design: .default)

        // Body
        static let bodyLarge = Font.system(size: 17, weight: .regular, design: .default)
        static let body = Font.system(size: 15, weight: .regular, design: .default)
        static let bodySmall = Font.system(size: 13, weight: .regular, design: .default)

        // Labels
        static let label = Font.system(size: 12, weight: .semibold, design: .default)
        static let labelSmall = Font.system(size: 10, weight: .bold, design: .default)

        // Mono — for timers and counters
        static let mono = Font.system(size: 15, weight: .medium, design: .monospaced)
        static let monoLarge = Font.system(size: 24, weight: .bold, design: .monospaced)
    }

    // MARK: - Spacing
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
        static let xxxl: CGFloat = 64
    }

    // MARK: - Corner Radius
    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let pill: CGFloat = 999
    }

    // MARK: - Shadows
    enum Shadows {
        static let card = Shadow(color: Color.black.opacity(0.5), radius: 20, x: 0, y: 8)
        static let button = Shadow(color: Color.black.opacity(0.3), radius: 8, x: 0, y: 4)
    }

    // MARK: - Animations
    enum Animation {
        static let spring = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.7)
        static let easeOut = SwiftUI.Animation.easeOut(duration: 0.25)
        static let easeIn = SwiftUI.Animation.easeIn(duration: 0.2)
        static let snappy = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.8)
    }
}

// MARK: - Shadow Helper
struct Shadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat
}

// MARK: - Color Hex Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - View Modifiers
struct HardflipButtonStyle: ButtonStyle {
    var variant: ButtonVariant = .primary

    enum ButtonVariant {
        case primary, secondary, destructive, ghost
    }

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Theme.Typography.heading3)
            .foregroundColor(foregroundColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(backgroundColor(pressed: configuration.isPressed))
            .cornerRadius(Theme.Radius.md)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(Theme.Animation.snappy, value: configuration.isPressed)
    }

    private var foregroundColor: Color {
        switch variant {
        case .primary: return .black
        case .secondary: return Theme.Colors.primary
        case .destructive: return .white
        case .ghost: return Theme.Colors.primary
        }
    }

    private func backgroundColor(pressed: Bool) -> Color {
        let base: Color
        switch variant {
        case .primary: base = .white
        case .secondary: base = Theme.Colors.surfaceElevated
        case .destructive: base = Theme.Colors.accent
        case .ghost: base = Color.clear
        }
        return pressed ? base.opacity(0.85) : base
    }
}

extension View {
    func hardflipCard() -> some View {
        self
            .background(Theme.Colors.cardBackground)
            .cornerRadius(Theme.Radius.lg)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.lg)
                    .stroke(Theme.Colors.border, lineWidth: 1)
            )
    }

    func hardflipSurface() -> some View {
        self
            .background(Theme.Colors.surface)
            .cornerRadius(Theme.Radius.md)
    }
}
