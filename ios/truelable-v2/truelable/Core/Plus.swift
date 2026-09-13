//
//  Plus.swift
//  truelable
//
//  StoreKit 2 subscription state. One source of truth for "is Plus on",
//  refreshed from current entitlements and kept fresh by the transaction
//  stream. Everything you use today stays free; Plus gates the extra layer
//  (trends, wider compare, ranked swaps).
//

import Foundation
import StoreKit

@Observable
@MainActor
final class Plus {
    static let shared = Plus()

    static let monthlyID = "fun.truelabel.plus.monthly"
    static let yearlyID = "fun.truelabel.plus.yearly"
    static let ids = [yearlyID, monthlyID]

    /// Free tier limits — the numbers Plus lifts.
    static let freeCompareLimit = 2
    static let freeAlternativesLimit = 3

    private(set) var isActive = false
    private(set) var products: [StoreKit.Product] = []
    private var updates: Task<Void, Never>?

    private init() {
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await transaction.finish()
                    await self?.refresh()
                }
            }
        }
        Task {
            await refresh()
            await loadProducts()
        }
    }

    func refresh() async {
        var active = false
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result, Self.ids.contains(t.productID), t.revocationDate == nil {
                active = true
            }
        }
        isActive = active
    }

    func loadProducts() async {
        products = (try? await StoreKit.Product.products(for: Self.ids)) ?? []
    }
}
