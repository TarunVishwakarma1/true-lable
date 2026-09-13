//
//  HomeView.swift
//  truelable
//
//  The landing tab: one obvious action (scan), then the real content this
//  device has generated — recent products, this week's pattern, and a nudge
//  to help verify. Nothing here is placeholder; every number is earned.
//

import SwiftUI
import SwiftData
import Charts

struct HomeView: View {
    @Environment(AppRouter.self) private var router
    @Query(sort: \ScanRecord.scannedAt, order: .reverse) private var records: [ScanRecord]
    @AppStorage(Keys.verifiedCount) private var verifiedCount = 0
    @AppStorage(Keys.dietary) private var dietaryRaw = ""
    @State private var queueCount: Int?
    @Namespace private var zoom

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    hero
                    stats
                    if !records.isEmpty {
                        recents
                        week
                    }
                    verifyNudge
                    if DietaryPreference.decode(dietaryRaw).isEmpty {
                        preferencesNudge
                    }
                }
                .padding(.horizontal, TL.gutter)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
            .background { Backdrop() }
            .screenBackground()
            .scrollIndicators(.hidden)
            .navigationTitle("TrueLabel")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: String.self) { barcode in
                ProductLoaderScreen(barcode: barcode, initial: records.first { $0.barcode == barcode }?.product)
                    .navigationTransition(.zoom(sourceID: barcode, in: zoom))
            }
            .task { queueCount = try? await API.needsVerification(limit: 12).count }
        }
    }

    // MARK: Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Eyebrow(text: greeting)
                Spacer()
                Pill(text: "\(API.country)", color: TL.fg2, icon: "globe")
            }
            Text("What's really\nin it?")
                .font(.system(size: 36, weight: .bold))
                .tracking(-1)
                .lineSpacing(-2)
            Text("Point at a barcode. Sugar in teaspoons, additives by name, and whether it fits how you eat.")
                .font(.subheadline)
                .foregroundStyle(TL.fg2)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 10) {
                Button {
                    router.scannerPresented = true
                } label: {
                    Label("Scan", systemImage: "barcode.viewfinder")
                }
                .buttonStyle(.primary)

                Button {
                    router.manualEntryPresented = true
                } label: {
                    Image(systemName: "keyboard")
                        .font(.body.weight(.semibold))
                        .frame(width: 56, height: 56)
                }
                .buttonStyle(.secondary)
                .frame(width: 56)
                .accessibilityLabel("Type a barcode")
            }
        }
        .card(radius: 28, fill: TL.surface.opacity(0.85), padding: 22)
    }

    private var greeting: String {
        switch Calendar.current.component(.hour, from: .now) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        case 17..<22: "Good evening"
        default: "Late night snack?"
        }
    }

    // MARK: Stats

    private var stats: some View {
        HStack(spacing: 10) {
            StatTile(value: "\(records.count)", label: "Products", icon: "barcode")
            StatTile(value: "\(thisWeek)", label: "This week", icon: "calendar", tint: TL.info)
            StatTile(value: "\(verifiedCount)", label: "Confirmed", icon: "checkmark.seal.fill", tint: TL.warn)
        }
    }

    private var thisWeek: Int {
        let start = Calendar.current.date(byAdding: .day, value: -6, to: Calendar.current.startOfDay(for: .now))!
        return records.filter { $0.scannedAt >= start }.count
    }

    // MARK: Recents

    private var recents: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                SectionHeader(title: "Recent")
                Button("See all") { router.tab = .history }
                    .font(.footnote.weight(.semibold))
            }
            ScrollView(.horizontal) {
                HStack(spacing: 10) {
                    ForEach(records.prefix(8)) { record in
                        NavigationLink(value: record.barcode) {
                            RecentCard(record: record)
                        }
                        .buttonStyle(.pressable)
                        .matchedTransitionSource(id: record.barcode, in: zoom)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
        }
    }

    // MARK: Week

    private var days: [(date: Date, count: Int)] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        return (0..<7).reversed().map { offset in
            let day = cal.date(byAdding: .day, value: -offset, to: today)!
            return (day, records.filter { cal.isDate($0.scannedAt, inSameDayAs: day) }.count)
        }
    }

    private var week: some View {
        VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Your week", detail: "\(thisWeek) look-ups")
            Chart(days, id: \.date) { day in
                BarMark(x: .value("Day", day.date, unit: .day), y: .value("Scans", day.count))
                    .foregroundStyle(day.count > 0 ? TL.accent : Color.white.opacity(0.1))
                    .cornerRadius(4)
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { _ in
                    AxisValueLabel(format: .dateTime.weekday(.narrow), centered: true)
                        .foregroundStyle(TL.fg3)
                }
            }
            .chartYAxis(.hidden)
            .frame(height: 96)

            if let sugar = average(\.sugarGrams) {
                gauge("Avg. sugar per scan", sugar, of: 50, unit: "g", color: TL.warn)
            }
            if let sodium = average(\.sodiumMg) {
                gauge("Avg. sodium per scan", sodium, of: 2000, unit: "mg", color: TL.danger)
            }
            Text("Per-100g averages against WHO free-sugar (50 g/day) and ICMR sodium (2,000 mg/day) guidelines.")
                .font(.caption2)
                .foregroundStyle(TL.fg3)
        }
        .card()
    }

    private func average(_ key: KeyPath<ScanRecord, Double?>) -> Double? {
        let values = records.compactMap { $0[keyPath: key] }
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

    // MARK: Nudges

    @ViewBuilder
    private var verifyNudge: some View {
        if let queueCount, queueCount > 0 {
            Button { router.tab = .verify } label: {
                HStack(spacing: 14) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.title3)
                        .foregroundStyle(TL.accent)
                        .frame(width: 44, height: 44)
                        .background(TL.accent.opacity(0.14), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(queueCount) labels need a second pair of eyes")
                            .font(.subheadline.weight(.semibold))
                        Text("Takes seconds. Keeps the data honest.")
                            .font(.footnote)
                            .foregroundStyle(TL.fg2)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
                }
                .card(radius: 20, padding: 14)
            }
            .buttonStyle(.pressable)
        }
    }

    private var preferencesNudge: some View {
        Button { router.tab = .you } label: {
            HStack(spacing: 14) {
                Image(systemName: "slider.horizontal.3")
                    .font(.title3)
                    .foregroundStyle(TL.info)
                    .frame(width: 44, height: 44)
                    .background(TL.info.opacity(0.14), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Tell us what to watch for")
                        .font(.subheadline.weight(.semibold))
                    Text("Allergies, sugar, palm oil — flagged first on every scan.")
                        .font(.footnote)
                        .foregroundStyle(TL.fg2)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
            }
            .card(radius: 20, padding: 14)
        }
        .buttonStyle(.pressable)
    }
}

struct RecentCard: View {
    let record: ScanRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                ProductThumb(url: record.imageURL, size: 52, radius: 14)
                Spacer()
                if let grade = record.nutriscoreGrade {
                    Text(grade.uppercased())
                        .font(.caption.weight(.heavy))
                        .foregroundStyle(TL.ink)
                        .frame(width: 26, height: 26)
                        .background(TL.grade(grade), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                }
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(record.name)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(record.brand.isEmpty ? record.scannedAt.formatted(.relative(presentation: .named)) : record.brand)
                    .font(.caption)
                    .foregroundStyle(TL.fg3)
                    .lineLimit(1)
            }
        }
        .frame(width: 150, alignment: .leading)
        .card(radius: 20, padding: 14)
    }
}

#Preview {
    HomeView()
        .environment(AppRouter())
        .modelContainer(for: ScanRecord.self, inMemory: true)
        .preferredColorScheme(.dark)
}
