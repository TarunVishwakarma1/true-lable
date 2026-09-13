//
//  ProfileView.swift
//  truelable
//
//  No account, so "You" is your preferences and your activity — all of it
//  real and all of it on this phone.
//

import SwiftUI
import SwiftData

struct ProfileView: View {
    @Query private var records: [ScanRecord]
    @Environment(\.modelContext) private var context
    @AppStorage(Keys.verifiedCount) private var verifiedCount = 0
    @AppStorage(Keys.dietary) private var dietaryRaw = ""
    @State private var confirmClear = false

    private var prefs: Set<DietaryPreference> { DietaryPreference.decode(dietaryRaw) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    stats
                    watchFor
                    about
                    data
                }
                .padding(.horizontal, TL.gutter)
                .padding(.bottom, 32)
            }
            .background { Backdrop() }
            .screenBackground()
            .scrollIndicators(.hidden)
            .navigationTitle("You")
        }
        .confirmationDialog("Clear scan history?", isPresented: $confirmClear, titleVisibility: .visible) {
            Button("Clear \(records.count) products", role: .destructive) {
                records.forEach(context.delete)
            }
        } message: {
            Text("This only removes the list on this phone. Community verifications you made stay counted.")
        }
    }

    private var stats: some View {
        HStack(spacing: 10) {
            StatTile(value: "\(records.count)", label: "Products looked up", icon: "barcode")
            StatTile(value: "\(verifiedCount)", label: "Labels confirmed", icon: "checkmark.seal.fill", tint: TL.warn)
        }
    }

    private var watchFor: some View {
        VStack(alignment: .leading, spacing: 14) {
            SectionHeader(title: "Watch for", detail: prefs.isEmpty ? "Nothing yet" : "\(prefs.count) on")
            Text("Every scan checks these first and tells you plainly — including when the data can't say.")
                .font(.footnote)
                .foregroundStyle(TL.fg2)
            DietaryChips(raw: $dietaryRaw)
        }
        .card()
    }

    private var about: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionHeader(title: "About")
                .padding(.bottom, 10)
            row("Region", value: API.country, icon: "globe")
            Divider().overlay(TL.line)
            row("Data", value: "Open Food Facts + community", icon: "tray.full")
            Divider().overlay(TL.line)
            Link(destination: URL(string: "https://github.com/TarunVishwakarma1/true-lable")!) {
                HStack {
                    Label("Source code · Apache-2.0", systemImage: "chevron.left.forwardslash.chevron.right")
                        .font(.subheadline)
                        .foregroundStyle(TL.fg)
                    Spacer()
                    Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
                }
                .padding(.vertical, 12)
            }
            Divider().overlay(TL.line)
            row("Version", value: version, icon: "app.badge")
        }
        .card()
    }

    private var data: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Your data")
            Text("Nothing here needs an account. History and preferences live on this phone only.")
                .font(.footnote)
                .foregroundStyle(TL.fg2)
            Button(role: .destructive) { confirmClear = true } label: {
                Label("Clear scan history", systemImage: "trash")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TL.danger)
            }
            .disabled(records.isEmpty)
            .opacity(records.isEmpty ? 0.5 : 1)
            .padding(.top, 4)
        }
        .card()
    }

    private func row(_ label: String, value: String, icon: String) -> some View {
        HStack {
            Label(label, systemImage: icon).font(.subheadline)
            Spacer()
            Text(value).font(.footnote).foregroundStyle(TL.fg3)
        }
        .padding(.vertical, 12)
    }

    private var version: String {
        let short = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "2.0"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(short) (\(build))"
    }
}

#Preview {
    ProfileView()
        .modelContainer(for: ScanRecord.self, inMemory: true)
        .preferredColorScheme(.dark)
}
