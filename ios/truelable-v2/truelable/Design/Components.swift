//
//  Components.swift
//  truelable
//
//  The small shared vocabulary every screen is built from.
//

import SwiftUI

// MARK: - Buttons

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(TL.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(TL.accentGradient, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .shadow(color: TL.accent.opacity(configuration.isPressed ? 0.1 : 0.3), radius: 18, y: 8)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.tl(0.25), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(TL.fg)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(TL.elevated, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(TL.line))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.tl(0.25), value: configuration.isPressed)
    }
}

struct PressableStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.tl(0.25), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryButtonStyle {
    static var primary: PrimaryButtonStyle { .init() }
}
extension ButtonStyle where Self == SecondaryButtonStyle {
    static var secondary: SecondaryButtonStyle { .init() }
}
extension ButtonStyle where Self == PressableStyle {
    static var pressable: PressableStyle { .init() }
}

/// Round glass icon button for chrome over camera/hero content.
struct IconButton: View {
    var systemImage: String
    var label: String
    var active: Bool = false
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.body.weight(.semibold))
                .foregroundStyle(active ? TL.ink : TL.fg)
                .frame(width: 44, height: 44)
                .glassEffect(active ? .regular.tint(TL.accent).interactive() : .regular.interactive(), in: .circle)
        }
        .buttonStyle(.pressable)
        .accessibilityLabel(label)
    }
}

// MARK: - Text bits

struct SectionHeader: View {
    var title: String
    var detail: String? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline)
                .foregroundStyle(TL.fg)
            Spacer()
            if let detail {
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(TL.fg3)
            }
        }
    }
}

struct Eyebrow: View {
    var text: String
    var body: some View {
        Text(text.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(1.4)
            .foregroundStyle(TL.fg3)
    }
}

struct Pill: View {
    var text: String
    var color: Color = TL.fg2
    var icon: String? = nil
    var filled: Bool = false

    var body: some View {
        HStack(spacing: 5) {
            if let icon { Image(systemName: icon).font(.caption2.weight(.bold)) }
            Text(text).font(.caption.weight(.semibold))
        }
        .foregroundStyle(filled ? TL.ink : color)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(filled ? color : color.opacity(0.14), in: Capsule())
    }
}

// MARK: - Data visuals

struct ScoreRing: View {
    var score: Int
    var color: Color
    var size: CGFloat = 88
    var lineWidth: CGFloat = 9

    @State private var shown = false

    var body: some View {
        ZStack {
            Circle().stroke(Color.white.opacity(0.08), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: shown ? CGFloat(score) / 100 : 0)
                .stroke(color, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.tl(0.9), value: shown)
            VStack(spacing: 0) {
                Text("\(score)")
                    .font(.system(size: size * 0.3, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Text("/100")
                    .font(.system(size: size * 0.11, weight: .semibold))
                    .foregroundStyle(TL.fg3)
            }
        }
        .frame(width: size, height: size)
        .onAppear { shown = true }
        .accessibilityElement()
        .accessibilityLabel("Score \(score) out of 100")
    }
}

/// A–E strip with the product's grade lit up. Letter + colour, never
/// colour alone.
struct GradeStrip: View {
    var grade: String?

    var body: some View {
        HStack(spacing: 4) {
            ForEach(["a", "b", "c", "d", "e"], id: \.self) { letter in
                let on = grade?.lowercased() == letter
                Text(letter.uppercased())
                    .font(.caption.weight(.heavy))
                    .foregroundStyle(on ? TL.ink : TL.fg3)
                    .frame(width: on ? 34 : 26, height: 26)
                    .background(on ? TL.grade(letter) : Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
            }
        }
        .accessibilityElement()
        .accessibilityLabel(grade.map { "Nutri-Score \($0.uppercased())" } ?? "No Nutri-Score")
    }
}

struct BarMeter: View {
    var fraction: Double
    var color: Color
    var height: CGFloat = 6

    @State private var shown = false

    var body: some View {
        GeometryReader { geo in
            RoundedRectangle(cornerRadius: height / 2)
                .fill(Color.white.opacity(0.08))
                .overlay(alignment: .leading) {
                    RoundedRectangle(cornerRadius: height / 2)
                        .fill(color)
                        .frame(width: geo.size.width * (shown ? min(max(fraction, 0), 1) : 0))
                        .animation(.tl(0.8), value: shown)
                }
        }
        .frame(height: height)
        .onAppear { shown = true }
    }
}

struct StatTile: View {
    var value: String
    var label: String
    var icon: String
    var tint: Color = TL.accent

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(tint)
            Text(value)
                .font(.title2.weight(.bold))
                .monospacedDigit()
                .contentTransition(.numericText())
            Text(label)
                .font(.caption)
                .foregroundStyle(TL.fg3)
        }
        .card(radius: 20, padding: 16)
    }
}

// MARK: - Product image

struct ProductThumb: View {
    var url: URL?
    var size: CGFloat = 64
    var radius: CGFloat = 16

    var body: some View {
        AsyncImage(url: url, transaction: Transaction(animation: .tl(0.4))) { phase in
            if let image = phase.image {
                image.resizable().scaledToFill()
                    .transition(.opacity)
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: radius, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(TL.line))
    }

    private var placeholder: some View {
        ZStack {
            TL.elevated
            Image(systemName: "barcode")
                .font(.system(size: size * 0.36, weight: .medium))
                .foregroundStyle(TL.fg3)
        }
    }
}

// MARK: - Loading

/// Pulsing placeholder rows — cheap (opacity only), no blur, no timeline.
struct Skeleton: View {
    var lines: Int = 3
    var height: CGFloat = 12

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(0..<lines, id: \.self) { i in
                RoundedRectangle(cornerRadius: height / 2)
                    .fill(Color.white.opacity(0.08))
                    .frame(width: i == lines - 1 ? 120 : nil, height: height)
            }
        }
        .phaseAnimator([0.5, 1.0]) { content, phase in
            content.opacity(phase)
        } animation: { _ in .easeInOut(duration: 0.8) }
    }
}

// MARK: - Product cards (search, trending, alternatives, compare picker)

/// Vertical card for horizontal strips.
struct ProductCardTile: View {
    let card: ProductCard
    var caption: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                ProductThumb(url: card.imageURL, size: 132, radius: 18)
                    .frame(maxWidth: .infinity)
                if let grade = card.nutriscoreGrade {
                    GradeBadge(grade: grade).padding(8)
                }
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(card.productName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .frame(minHeight: 36, alignment: .top)
                Text(caption ?? card.brand ?? " ")
                    .font(.caption)
                    .foregroundStyle(caption == nil ? TL.fg3 : TL.accent)
                    .lineLimit(1)
            }
        }
        .frame(width: 132)
        .card(radius: 24, padding: 12)
    }
}

/// Horizontal row for lists.
struct ProductCardRow: View {
    let card: ProductCard
    var trailing: String? = nil

    var body: some View {
        HStack(spacing: 14) {
            ProductThumb(url: card.imageURL, size: 56, radius: 16)
            VStack(alignment: .leading, spacing: 3) {
                Text(card.productName)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                HStack(spacing: 6) {
                    if let brand = card.brand { Text(brand).lineLimit(1) }
                    if card.verified {
                        Image(systemName: "checkmark.seal.fill").foregroundStyle(TL.accent)
                    }
                }
                .font(.caption)
                .foregroundStyle(TL.fg3)
            }
            Spacer(minLength: 8)
            VStack(alignment: .trailing, spacing: 6) {
                if let grade = card.nutriscoreGrade { GradeBadge(grade: grade) }
                if let trailing {
                    Text(trailing).font(.caption.weight(.semibold)).monospacedDigit().foregroundStyle(TL.accent)
                }
            }
            Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
        }
        .contentShape(Rectangle())
    }
}

struct GradeBadge: View {
    var grade: String
    var size: CGFloat = 26

    var body: some View {
        Text(grade.uppercased())
            .font(.system(size: size * 0.5, weight: .heavy))
            .foregroundStyle(TL.ink)
            .frame(width: size, height: size)
            .background(TL.grade(grade), in: RoundedRectangle(cornerRadius: size * 0.3, style: .continuous))
            .accessibilityLabel("Nutri-Score \(grade.uppercased())")
    }
}

/// Small "Plus" tag for gated affordances.
struct PlusTag: View {
    var body: some View {
        Text("PLUS")
            .font(.system(size: 9, weight: .heavy))
            .tracking(1)
            .foregroundStyle(TL.ink)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(TL.accentGradient, in: Capsule())
    }
}
