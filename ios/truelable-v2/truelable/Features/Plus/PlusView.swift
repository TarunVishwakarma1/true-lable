//
//  PlusView.swift
//  truelable
//
//  The upgrade screen, on StoreKit's own subscription UI so pricing,
//  trials, restore and family sharing behave exactly as the App Store
//  expects. Marketing content above is ours.
//

import SwiftUI
import StoreKit

struct PlusView: View {
    @Environment(\.dismiss) private var dismiss
    private let plus = Plus.shared

    var body: some View {
        NavigationStack {
            Group {
                if plus.isActive {
                    active
                } else {
                    store
                }
            }
            .screenBackground()
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close", systemImage: "xmark") { dismiss() }
                }
            }
        }
        .presentationBackground(TL.bg)
        .presentationCornerRadius(32)
    }

    private var store: some View {
        SubscriptionStoreView(productIDs: Plus.ids) {
            marketing
        }
        .subscriptionStoreControlStyle(.prominentPicker)
        .subscriptionStoreButtonLabel(.multiline)
        .storeButton(.visible, for: .restorePurchases)
        .storeButton(.hidden, for: .cancellation)
        .containerBackground(TL.bg, for: .subscriptionStore)
        .subscriptionStoreControlBackground(.gradientMaterial)
        .onInAppPurchaseCompletion { _, result in
            if case .success(.success) = result {
                await plus.refresh()
            }
        }
        .tint(TL.accent)
    }

    private var marketing: some View {
        VStack(alignment: .leading, spacing: 22) {
            HStack(spacing: 10) {
                BarcodeGlyph().frame(width: 44, height: 28)
                PlusTag()
            }
            Text("Everything you use\ntoday stays free.")
                .font(.display(34))
                .tracking(-0.6)
            Text("Scanning, results, verifying, adding products — none of it is behind Plus, and it won't be. Plus is the extra layer for people who want to go deeper.")
                .font(.subheadline)
                .foregroundStyle(TL.fg2)

            VStack(spacing: 12) {
                perk("chart.line.uptrend.xyaxis", "Trends over months", "Where sugar and sodium actually come from in what you buy, over 30 and 90 days.")
                perk("arrow.left.arrow.right", "Compare up to four", "Line up a whole shelf side by side, not just two.")
                perk("sparkles", "Ranked swaps", "Sort same-shelf alternatives by any nutrient, and see the full list.")
                perk("heart", "Keeps the lights on", "Servers, Open Food Facts contributions, no ads, no data sold.")
            }
        }
        .padding(.horizontal, 24)
        .padding(.top, 12)
        .padding(.bottom, 8)
    }

    private func perk(_ icon: String, _ title: String, _ body: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(TL.accent)
                .frame(width: 36, height: 36)
                .background(TL.accent.opacity(0.14), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(.subheadline.weight(.semibold))
                Text(body).font(.footnote).foregroundStyle(TL.fg2)
            }
        }
        .card(radius: 18, padding: 14)
    }

    private var active: some View {
        VStack(spacing: 18) {
            Spacer()
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundStyle(TL.accent)
            Text("You're on Plus")
                .font(.display(32))
            Text("Trends, four-way compare and ranked swaps are all on. Thank you for keeping this independent.")
                .font(.subheadline)
                .foregroundStyle(TL.fg2)
                .multilineTextAlignment(.center)
            Spacer()
            ManageSubscriptionButton()
            Button("Done") { dismiss() }
                .buttonStyle(.primary)
        }
        .padding(28)
    }
}

/// Opens the system subscription management sheet.
struct ManageSubscriptionButton: View {
    @State private var showing = false
    var body: some View {
        Button("Manage subscription") { showing = true }
            .buttonStyle(.secondary)
            .manageSubscriptionsSheet(isPresented: $showing)
    }
}

/// Inline upsell used on Home and Profile.
struct PlusBanner: View {
    var compact: Bool = false
    @State private var showing = false

    var body: some View {
        Button { showing = true } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(TL.accentGradient)
                        .frame(width: 44, height: 44)
                    Image(systemName: "sparkles")
                        .font(.body.weight(.bold))
                        .foregroundStyle(TL.ink)
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text("TrueLabel Plus").font(.subheadline.weight(.semibold))
                    }
                    Text(compact ? "Trends, four-way compare, ranked swaps." : "Trends over months, compare up to four, swaps ranked by any nutrient.")
                        .font(.footnote)
                        .foregroundStyle(TL.fg2)
                        .lineLimit(2)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
            }
            .card(radius: 20, fill: TL.elevated, padding: 14)
        }
        .buttonStyle(.pressable)
        .sheet(isPresented: $showing) { PlusView() }
    }
}

/// A row that says "this needs Plus" and opens the store.
struct PlusGate: View {
    var text: String
    @State private var showing = false

    var body: some View {
        Button { showing = true } label: {
            HStack(spacing: 10) {
                PlusTag()
                Text(text).font(.footnote.weight(.medium)).foregroundStyle(TL.fg2)
                Spacer()
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.pressable)
        .sheet(isPresented: $showing) { PlusView() }
    }
}
