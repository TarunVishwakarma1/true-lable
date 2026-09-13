//
//  TrueLabelApp.swift
//  truelable
//

import SwiftUI
import SwiftData

@main
struct TrueLabelApp: App {
    @State private var router = AppRouter()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(router)
                .preferredColorScheme(.dark)
                .tint(TL.accent)
        }
        .modelContainer(Self.container)
    }

    /// Own store file — this bundle ID shipped v1 with a different schema,
    /// and a store that fails to open loses local history rather than the
    /// whole app.
    private static let container: ModelContainer = {
        let url = URL.applicationSupportDirectory.appending(path: "truelabel-v2.store")
        let config = ModelConfiguration(url: url)
        if let c = try? ModelContainer(for: ScanRecord.self, configurations: config) { return c }
        try? FileManager.default.removeItem(at: url)
        return try! ModelContainer(for: ScanRecord.self, configurations: config)
    }()
}

/// The few pieces of navigation state more than one screen needs to reach:
/// which tab is up, and whether the scanner is presented.
@Observable
final class AppRouter {
    enum Tab: Hashable { case home, history, verify, you }
    var tab: Tab = .home
    var scannerPresented = false
    var manualEntryPresented = false
}
