//
//  Preferences.swift
//  truelable
//
//  Everything the user has told us about themselves lives on-device in
//  UserDefaults, read reactively through @AppStorage. No accounts.
//

import Foundation
import SwiftUI

enum Keys {
    static let onboarded = "v2.onboarded"
    static let dietary = "v2.prefs.dietary"
    static let verifiedCount = "v2.stats.verified"
    static let verifiedBarcodes = "v2.verified.barcodes"
}

/// One list of things to watch for. Turning one on changes what the
/// product screen flags first — nothing else.
enum DietaryPreference: String, CaseIterable, Identifiable, Sendable {
    case vegetarian = "Vegetarian"
    case vegan = "Vegan"
    case lowSugar = "Low sugar"
    case lowSodium = "Low sodium"
    case highProtein = "High protein"
    case peanutAllergy = "Peanut allergy"
    case lactoseSensitive = "Lactose sensitive"
    case glutenFree = "Gluten-free"
    case noPalmOil = "No palm oil"
    case jain = "Jain"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .vegetarian: "leaf"
        case .vegan: "leaf.fill"
        case .lowSugar: "cube"
        case .lowSodium: "drop"
        case .highProtein: "bolt"
        case .peanutAllergy: "exclamationmark.triangle"
        case .lactoseSensitive: "mug"
        case .glutenFree: "circle.slash"
        case .noPalmOil: "tree"
        case .jain: "hand.raised"
        }
    }

    // Stored as a comma-joined string so a plain @AppStorage<String> can
    // hold it and every screen updates together.
    static func decode(_ raw: String) -> Set<DietaryPreference> {
        Set(raw.split(separator: ",").compactMap { DietaryPreference(rawValue: String($0)) })
    }

    static func encode(_ set: Set<DietaryPreference>) -> String {
        allCases.filter(set.contains).map(\.rawValue).joined(separator: ",")
    }
}

/// UK FSA traffic-light thresholds per 100g — published references, not
/// numbers invented here. Sodium derived from the salt threshold ÷ 2.5.
enum Threshold {
    static let sugarHigh = 22.5, sugarLow = 5.0        // g
    static let sodiumHigh = 600.0, sodiumLow = 120.0   // mg
    static let proteinHigh = 10.0                       // g — "high in protein" claim floor (≥20% energy ≈ 10g/100g rule of thumb)
}

/// What the product screen's "For you" card shows: one verdict per enabled
/// preference, derived only from fields the product actually has. Missing
/// data says "couldn't check" — never a silent pass.
struct PersonalCheck: Identifiable, Hashable {
    enum Status { case good, caution, avoid, unknown }
    let preference: DietaryPreference
    let status: Status
    let message: String
    var id: String { preference.rawValue }

    static func run(_ prefs: Set<DietaryPreference>, on p: Product) -> [PersonalCheck] {
        DietaryPreference.allCases.filter(prefs.contains).map { pref in
            let (status, message) = evaluate(pref, p)
            return PersonalCheck(preference: pref, status: status, message: message)
        }
    }

    private static func evaluate(_ pref: DietaryPreference, _ p: Product) -> (Status, String) {
        let hasIngredients = p.ingredients != nil || p.allergens != nil
        switch pref {
        case .vegetarian:
            switch p.isVegetarian {
            case true: return (.good, "Vegetarian")
            case false: return (.avoid, "Not vegetarian")
            default: return (.unknown, "Vegetarian status unknown")
            }
        case .vegan:
            switch p.isVegan {
            case true: return (.good, "Vegan")
            case false: return (.avoid, "Not vegan")
            default: return (.unknown, "Vegan status unknown")
            }
        case .lowSugar:
            guard let s = p.nutrition.sugar else { return (.unknown, "No sugar data") }
            if s >= Threshold.sugarHigh { return (.avoid, "High sugar · \(s.compact) g/100g") }
            if s <= Threshold.sugarLow { return (.good, "Low sugar · \(s.compact) g/100g") }
            return (.caution, "Moderate sugar · \(s.compact) g/100g")
        case .lowSodium:
            guard let mg = p.nutrition.sodiumMg else { return (.unknown, "No sodium data") }
            if mg >= Threshold.sodiumHigh { return (.avoid, "High sodium · \(Int(mg)) mg/100g") }
            if mg <= Threshold.sodiumLow { return (.good, "Low sodium · \(Int(mg)) mg/100g") }
            return (.caution, "Moderate sodium · \(Int(mg)) mg/100g")
        case .highProtein:
            guard let pr = p.nutrition.protein else { return (.unknown, "No protein data") }
            return pr >= Threshold.proteinHigh
                ? (.good, "High protein · \(pr.compact) g/100g")
                : (.caution, "Not a protein source · \(pr.compact) g/100g")
        case .peanutAllergy:
            guard hasIngredients else { return (.unknown, "Ingredients not listed") }
            return p.contains(anyOf: ["peanut", "groundnut", "arachis"])
                ? (.avoid, "Contains peanuts") : (.good, "No peanuts listed")
        case .lactoseSensitive:
            guard hasIngredients else { return (.unknown, "Ingredients not listed") }
            return p.contains(anyOf: ["milk", "lactose", "whey", "casein", "butter", "cream", "cheese", "ghee", "curd", "yogurt", "yoghurt", "paneer"])
                ? (.caution, "Contains dairy") : (.good, "No dairy listed")
        case .glutenFree:
            guard hasIngredients else { return (.unknown, "Ingredients not listed") }
            return p.contains(anyOf: ["wheat", "gluten", "barley", "rye", "maida", "semolina", "suji", "atta", "malt"])
                ? (.avoid, "Contains gluten") : (.good, "No gluten sources listed")
        case .noPalmOil:
            switch p.isPalmOilFree {
            case true: return (.good, "Palm oil free")
            case false: return (.avoid, "Contains palm oil")
            default:
                guard hasIngredients else { return (.unknown, "Ingredients not listed") }
                return p.contains(anyOf: ["palm"]) ? (.avoid, "Contains palm oil") : (.good, "No palm oil listed")
            }
        case .jain:
            if p.isVegetarian == false { return (.avoid, "Not vegetarian") }
            guard hasIngredients else { return (.unknown, "Ingredients not listed") }
            return p.contains(anyOf: ["onion", "garlic", "potato", "carrot", "radish", "beetroot", "ginger", "turnip"])
                ? (.caution, "Has root vegetables or onion/garlic")
                : (.good, "No root vegetables or onion/garlic listed")
        }
    }
}

extension PersonalCheck.Status {
    var color: Color {
        switch self {
        case .good: TL.accent
        case .caution: TL.warn
        case .avoid: TL.danger
        case .unknown: TL.fg3
        }
    }
    var icon: String {
        switch self {
        case .good: "checkmark.circle.fill"
        case .caution: "exclamationmark.circle.fill"
        case .avoid: "xmark.octagon.fill"
        case .unknown: "questionmark.circle"
        }
    }
    /// Sort key: problems first.
    var rank: Int {
        switch self {
        case .avoid: 0
        case .caution: 1
        case .unknown: 2
        case .good: 3
        }
    }
}
