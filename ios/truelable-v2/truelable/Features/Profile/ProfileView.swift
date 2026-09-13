//
//  ProfileView.swift
//  truelable
//
//  No account, so "You" is your preferences and your activity — all of it
//  real and all of it on this phone.
//

import SwiftUI
import SwiftData
import Charts

struct ProfileView: View {
    @Query private var records: [ScanRecord]
    @Environment(\.modelContext) private var context
    @AppStorage(Keys.verifiedCount) private var verifiedCount = 0
    @AppStorage(Keys.dietary) private var dietaryRaw = ""
    @State private var confirmClear = false
    @State private var showingPlus = false
    @State private var trendWindow = 7
    private let plus = Plus.shared

    private var prefs: Set<DietaryPreference> { DietaryPreference.decode(dietaryRaw) }

    var body: some View {
        NavigationStack {
            ScrollView {
                GlassEffectContainer(spacing: 24) {
                    VStack(spacing: 24) {
                        stats
                        if !records.isEmpty { trends }
                        plusCard
                        watchFor
                        about
                        data
                    }
                }
                .padding(.horizontal, TL.gutter)
                .padding(.bottom, 32)
            }
            .screenBackground()
            .scrollIndicators(.hidden)
            .scrollBounceBehavior(.basedOnSize)
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

    // MARK: Trends

    private var windowDays: [(date: Date, count: Int)] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        return (0..<trendWindow).reversed().map { offset in
            let day = cal.date(byAdding: .day, value: -offset, to: today)!
            return (day, records.filter { cal.isDate($0.scannedAt, inSameDayAs: day) }.count)
        }
    }

    private var windowRecords: [ScanRecord] {
        let start = Calendar.current.date(byAdding: .day, value: -(trendWindow - 1), to: Calendar.current.startOfDay(for: .now))!
        return records.filter { $0.scannedAt >= start }
    }

    private var trends: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                SectionHeader(title: "Your trends")
                Picker("Window", selection: $trendWindow) {
                    Text("7d").tag(7)
                    Text("30d").tag(30)
                    Text("90d").tag(90)
                }
                .pickerStyle(.segmented)
                .frame(width: 150)
                .disabled(!plus.isActive)
            }
            if !plus.isActive {
                PlusGate(text: "30 and 90-day trends need Plus")
            }
            Chart(windowDays, id: \.date) { day in
                BarMark(x: .value("Day", day.date, unit: .day), y: .value("Products", day.count))
                    .foregroundStyle(day.count > 0 ? TL.accent : Color.white.opacity(0.1))
                    .cornerRadius(3)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day, count: trendWindow == 7 ? 1 : trendWindow / 6)) { _ in
                    AxisValueLabel(format: trendWindow == 7 ? .dateTime.weekday(.narrow) : .dateTime.day(), centered: trendWindow == 7)
                        .foregroundStyle(TL.fg3)
                }
            }
            .chartYAxis(.hidden)
            .frame(height: 96)
            .animation(.tl(0.4), value: trendWindow)

            if let sugar = average(\.sugarGrams) {
                gauge("Avg. sugar per product", sugar, of: 50, unit: "g", color: TL.warn)
            }
            if let sodium = average(\.sodiumMg) {
                gauge("Avg. sodium per product", sodium, of: 2000, unit: "mg", color: TL.danger)
            }
            Text("Per-100 g averages of the last \(trendWindow) days against WHO free-sugar (50 g/day) and ICMR sodium (2,000 mg/day) guidelines.")
                .font(.caption2)
                .foregroundStyle(TL.fg3)
        }
        .card()
    }

    private func average(_ key: KeyPath<ScanRecord, Double?>) -> Double? {
        let values = windowRecords.compactMap { $0[keyPath: key] }
        guard !values.isEmpty else { return nil }
        return values.reduce(0, +) / Double(values.count)
    }

    private func gauge(_ label: String, _ value: Double, of guideline: Double, unit: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label).font(.footnote.weight(.medium))
                Spacer()
                Text("\(value.compact) \(unit) · \(Int((value / guideline * 100).rounded()))% of daily")
                    .font(.caption)
                    .monospacedDigit()
                    .foregroundStyle(TL.fg3)
            }
            BarMeter(fraction: value / guideline, color: color)
        }
    }

    private var plusCard: some View {
        Group {
            if plus.isActive {
                Button { showingPlus = true } label: {
                    HStack(spacing: 14) {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.title3)
                            .foregroundStyle(TL.ink)
                            .frame(width: 44, height: 44)
                            .background(TL.accentGradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("TrueLabel Plus is on").font(.subheadline.weight(.semibold))
                            Text("Trends, four-way compare, ranked swaps. Tap to manage.").font(.footnote).foregroundStyle(TL.fg2)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
                    }
                    .card(radius: 20, fill: TL.elevated, padding: 14)
                }
                .buttonStyle(.pressable)
                .sheet(isPresented: $showingPlus) { PlusView() }
            } else {
                PlusBanner()
            }
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
