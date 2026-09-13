//
//  RootView.swift
//  truelable
//
//  Four places to be (Home, History, Verify, You) and one action — Scan —
//  which lives in the tab bar's bottom accessory so it's one tap away from
//  every screen, the way a quick-commerce cart button is.
//

import SwiftUI
import SwiftData

struct RootView: View {
    @AppStorage(Keys.onboarded) private var onboarded = false
    @Environment(AppRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        Group {
            if onboarded {
                tabs
                    .transition(.opacity)
            } else {
                OnboardingView { withAnimation(.tl(0.5)) { onboarded = true } }
                    .transition(.opacity)
            }
        }
        .fullScreenCover(isPresented: $router.scannerPresented) {
            ScanScreen()
        }
        .sheet(isPresented: $router.manualEntryPresented) {
            ManualEntrySheet()
        }
    }

    private var tabs: some View {
        @Bindable var router = router
        return TabView(selection: $router.tab) {
            Tab("Home", systemImage: "house.fill", value: AppRouter.Tab.home) { HomeView() }
            Tab("History", systemImage: "clock.fill", value: AppRouter.Tab.history) { HistoryView() }
            Tab("Verify", systemImage: "checkmark.seal.fill", value: AppRouter.Tab.verify) { VerifyView() }
            Tab("You", systemImage: "person.fill", value: AppRouter.Tab.you) { ProfileView() }
        }
        .tabViewBottomAccessory {
            ScanAccessory()
        }
    }
}

/// The always-available scan button that rides above the tab bar.
private struct ScanAccessory: View {
    @Environment(AppRouter.self) private var router
    @Environment(\.tabViewBottomAccessoryPlacement) private var placement

    var body: some View {
        Button {
            router.scannerPresented = true
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "barcode.viewfinder")
                    .font(.body.weight(.semibold))
                Text(placement == .inline ? "Scan" : "Scan a product")
                    .font(.subheadline.weight(.semibold))
                Spacer(minLength: 0)
                Image(systemName: "arrow.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(TL.ink.opacity(0.7))
            }
            .foregroundStyle(TL.ink)
            .padding(.horizontal, 16)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TL.accent)
            .contentShape(Rectangle())
        }
        .buttonStyle(.pressable)
        .accessibilityLabel("Scan a product")
    }
}

#Preview {
    RootView()
        .environment(AppRouter())
        .modelContainer(for: ScanRecord.self, inMemory: true)
        .preferredColorScheme(.dark)
}
