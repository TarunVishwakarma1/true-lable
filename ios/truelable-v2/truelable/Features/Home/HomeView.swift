//
//  HomeView.swift
//  truelable
//
//  The landing tab: one obvious action (scan), a way in without the pack
//  (search), then the real content this device has generated — recent
//  products, what's popular nearby, this week's pattern. Nothing here is
//  placeholder; every number is earned.
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
    @State private var trending: [ProductCard] = []
    @State private var trendWindow = 7
    @Namespace private var zoom
    private let plus = Plus.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    hero
                    searchBar
                    stats
                    if !records.isEmpty { recents }
                    if !trending.isEmpty { popular }
                    if !records.isEmpty { week }
                    if !plus.isActive { PlusBanner().reveal() }
                    verifyNudge
                    if DietaryPreference.decode(dietaryRaw).isEmpty { preferencesNudge }
                }
                .padding(.horizontal, TL.gutter)
                .padding(.top, 4)
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
            .task {
                async let queue = API.needsVerification(limit: 12)
                async let popular = API.trending(limit: 10)
                queueCount = try? await queue.count
                let found = (try? await popular) ?? []
                withAnimation(.tl(0.4)) { trending = found }
            }
        }
    }

    // MARK: Hero

    private var hero: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Eyebrow(text: greeting)
                Spacer()
                Pill(text: API.country, color: TL.fg2, icon: "globe")
            }
            Text("What's really\nin it?")
                .font(.display(42))
                .tracking(-1)
                .lineSpacing(-4)
            Text("Point at a barcode. Sugar in teaspoons, additives by name, and whether it fits how you eat.")
                .font(.subheadline)
                .foregroundStyle(TL.fg2)
                .fixedSize(horizontal: false, vertical: true)

            Button {
                router.scannerPresented = true
            } label: {
                Label("Scan a barcode", systemImage: "barcode.viewfinder")
            }
            .buttonStyle(.primary)
        }
        .card(radius: 30, fill: TL.surface, padding: 24)
        .background {
            // One warm accent glow bleeding out of the hero — static.
            RadialGradient(colors: [TL.accent.opacity(0.22), .clear], center: .topTrailing, startRadius: 0, endRadius: 320)
                .blur(radius: 30)
                .offset(x: 40, y: -60)
                .allowsHitTesting(false)
        }
    }

    private var greeting: String {
        switch Calendar.current.component(.hour, from: .now) {
        case 5..<12: "Good morning"
        case 12..<17: "Good afternoon"
        case 17..<22: "Good evening"
        default: "Late night snack?"
        }
    }

    private var searchBar: some View {
        NavigationLink {
            SearchScreen()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "magnifyingglass")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(TL.fg2)
                Text("Search a product or brand")
                    .font(.subheadline)
                    .foregroundStyle(TL.fg3)
                Spacer()
                Button {
                    router.manualEntryPresented = true
                } label: {
                    Image(systemName: "keyboard")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TL.fg2)
                        .frame(width: 32, height: 32)
                        .background(TL.elevated, in: Circle())
                }
                .buttonStyle(.pressable)
                .accessibilityLabel("Type a barcode")
            }
            .padding(.horizontal, 16)
            .frame(height: 54)
            .background(TL.surface, in: Capsule())
            .overlay(Capsule().strokeBorder(TL.line))
        }
        .buttonStyle(.pressable)
    }

    // MARK: Stats

    private var stats: some View {
        HStack(spacing: 10) {
            StatTile(value: "\(records.count)", label: "Products", icon: "barcode")
            StatTile(value: "\(count(days: 7))", label: "This week", icon: "calendar", tint: TL.info)
            StatTile(value: "\(verifiedCount)", label: "Confirmed", icon: "checkmark.seal.fill", tint: TL.warn)
        }
    }

    private func count(days: Int) -> Int {
        let start = Calendar.current.date(byAdding: .day, value: -(days - 1), to: Calendar.current.startOfDay(for: .now))!
        return records.filter { $0.scannedAt >= start }.count
    }

    // MARK: Strips

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
                        NavigationLink(value: record.barcode) { RecentCard(record: record) }
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
        .reveal()
    }

    private var popular: some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Popular in \(API.country)", detail: "what people are scanning")
            ScrollView(.horizontal) {
                HStack(spacing: 10) {
                    ForEach(trending) { card in
                        NavigationLink(value: card.barcode) { ProductCardTile(card: card) }
                            .buttonStyle(.pressable)
                    }
                }
                .scrollTargetLayout()
            }
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
        }
        .reveal()
    }

    // MARK: Trends

    private var days: [(date: Date, count: Int)] {
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

    private var week: some View {
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
            Chart(days, id: \.date) { day in
                BarMark(x: .value("Day", day.date, unit: .day), y: .value("Scans", day.count))
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
        .reveal()
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

    // MARK: Nudges

    @ViewBuilder
    private var verifyNudge: some View {
        if let queueCount, queueCount > 0 {
            nudge(icon: "checkmark.seal.fill", tint: TL.accent,
                  title: "\(queueCount) labels need a second pair of eyes",
                  body: "Takes seconds. Keeps the data honest.") { router.tab = .verify }
        }
    }

    private var preferencesNudge: some View {
        nudge(icon: "slider.horizontal.3", tint: TL.info,
              title: "Tell us what to watch for",
              body: "Allergies, sugar, palm oil — flagged first on every scan.") { router.tab = .you }
    }

    private func nudge(icon: String, tint: Color, title: String, body: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(tint)
                    .frame(width: 44, height: 44)
                    .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.subheadline.weight(.semibold))
                    Text(body).font(.footnote).foregroundStyle(TL.fg2)
                }
                Spacer()
                Image(systemName: "chevron.right").font(.caption.weight(.bold)).foregroundStyle(TL.fg3)
            }
            .card(radius: 20, padding: 14)
        }
        .buttonStyle(.pressable)
        .reveal()
    }
}

struct RecentCard: View {
    let record: ScanRecord

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                ProductThumb(url: record.imageURL, size: 56, radius: 16)
                Spacer()
                if let grade = record.nutriscoreGrade { GradeBadge(grade: grade) }
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(record.name)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .frame(minHeight: 36, alignment: .top)
                Text(record.brand.isEmpty ? record.scannedAt.formatted(.relative(presentation: .named)) : record.brand)
                    .font(.caption)
                    .foregroundStyle(TL.fg3)
                    .lineLimit(1)
            }
        }
        .frame(width: 150, alignment: .leading)
        .card(radius: 22, padding: 14)
    }
}

#Preview {
    HomeView()
        .environment(AppRouter())
        .modelContainer(for: ScanRecord.self, inMemory: true)
        .preferredColorScheme(.dark)
}
