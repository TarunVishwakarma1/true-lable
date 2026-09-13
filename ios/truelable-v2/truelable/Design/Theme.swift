//
//  Theme.swift
//  truelable
//
//  TrueLabel v2 design language. Dark-only, editorial, quiet: one accent,
//  three text tones, one corner radius, one motion curve. Everything that
//  looks "designed" in the app comes from these few constants.
//

import SwiftUI

enum TL {
    // Surfaces
    static let bg = Color(hex: 0x0A0B0D)
    static let surface = Color(hex: 0x15171B)
    static let elevated = Color(hex: 0x1E2127)
    static let line = Color.white.opacity(0.08)

    // Text
    static let fg = Color(hex: 0xF4F5F7)
    static let fg2 = Color.white.opacity(0.64)
    static let fg3 = Color.white.opacity(0.40)

    // Brand + semantics
    static let accent = Color(hex: 0x34E0A1)
    static let accentDeep = Color(hex: 0x1DB783)
    static let ink = Color(hex: 0x04261B)
    static let warn = Color(hex: 0xF5A524)
    static let danger = Color(hex: 0xFF6B5E)
    static let info = Color(hex: 0x6FA8FF)

    // The "physical label" paper — the one warm surface in the app.
    static let paper = Color(hex: 0xF4EFE2)
    static let paperInk = Color(hex: 0x2A2620)
    static let paperMuted = Color(hex: 0x6B6357)

    static let radius: CGFloat = 24
    static let gutter: CGFloat = 20

    static let accentGradient = LinearGradient(
        colors: [Color(hex: 0x66F1BE), Color(hex: 0x21C68B)],
        startPoint: .top, endPoint: .bottom
    )

    static func grade(_ letter: String?) -> Color {
        switch letter?.lowercased() {
        case "a": return accent
        case "b": return Color(hex: 0x9BE36B)
        case "c": return warn
        case "d": return Color(hex: 0xFF8A4C)
        case "e": return danger
        default: return fg3
        }
    }

    static func nova(_ group: Int?) -> Color {
        switch group {
        case 1: return accent
        case 2: return Color(hex: 0x9BE36B)
        case 3: return warn
        case 4: return danger
        default: return fg3
        }
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

extension Animation {
    /// The one signature curve (ease-out-expo). Every animation in the app
    /// uses this so motion reads as a single language.
    static func tl(_ duration: Double = 0.45) -> Animation {
        .timingCurve(0.16, 1, 0.3, 1, duration: duration)
    }
}

extension Font {
    /// Display type is serif (New York) — the one typographic move that
    /// makes the app read as editorial rather than a settings screen. Body
    /// and UI stay SF.
    static func display(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}

extension View {
    /// Text and icons cut into the surface: a dark groove above each glyph
    /// and a lit lip below it. Applied once per card subtree — nesting it
    /// doubles the effect and reads as a blur.
    func engraved(_ strength: Double = 1) -> some View {
        shadow(color: .black.opacity(0.55 * strength), radius: 1, y: -0.5)
            .shadow(color: .white.opacity(0.16 * strength), radius: 0, y: 1)
    }

    /// Every surface in the app. `fill` tints the glass rather than hiding
    /// what is behind it.
    func card(radius: CGFloat = TL.radius, fill: Color = TL.surface, padding: CGFloat = 20) -> some View {
        modifier(GlassCard(radius: radius, tint: fill, padding: padding))
    }

    /// The ground every screen stands on: a flat base, then the static
    /// mesh the glass surfaces refract.
    func screenBackground() -> some View {
        background { Backdrop() }
            .background(TL.bg.ignoresSafeArea())
    }
}

/// ponytail: one glass layer per card, no GlassEffectContainer. Group them
/// in a container if a screen ever shows enough cards at once to drop frames.
private struct GlassCard: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    var radius: CGFloat
    var tint: Color
    var padding: CGFloat

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        let inner = content
            .engraved()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)

        if reduceTransparency {
            inner
                .background(tint, in: shape)
                .overlay(shape.strokeBorder(TL.line))
        } else {
            inner
                .glassEffect(.regular.tint(tint.opacity(0.45)), in: shape)
                .overlay {
                    shape.strokeBorder(
                        LinearGradient(colors: [.white.opacity(0.22), .white.opacity(0.04)],
                                       startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 1
                    )
                    .allowsHitTesting(false)
                }
        }
    }
}

// MARK: - Formatting

extension Double {
    /// "12.5" / "12" — trims a pointless ".0".
    var compact: String {
        formatted(.number.precision(.fractionLength(0...1)))
    }
}

extension String {
    var nilIfBlank: String? {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self
    }
}
