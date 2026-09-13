//
//  truelableTests.swift
//  truelableTests
//
//  One check per piece of logic that would break silently: check digits,
//  API decoding (including the tolerant nutrition parse), the personal
//  flag engine, and additive classes.
//

import Foundation
import Testing
@testable import truelable

struct ChecksumTests {
    @Test func acceptsRealBarcodes() {
        #expect(BarcodeChecksum.isValid("8901030895564"))   // EAN-13
        #expect(BarcodeChecksum.isValid("036000291452"))    // UPC-A
        #expect(BarcodeChecksum.isValid("0036000291452"))   // same, EAN-13 form
        #expect(BarcodeChecksum.isValid("96385074"))        // EAN-8
    }

    @Test func rejectsBadOnes() {
        #expect(!BarcodeChecksum.isValid("8901030895563"))
        #expect(!BarcodeChecksum.isValid("12345"))
        #expect(!BarcodeChecksum.isValid("89010308955A4"))
    }

    @Test func normalizesUPCA() {
        #expect(BarcodeChecksum.normalized("036000291452") == "0036000291452")
        #expect(BarcodeChecksum.normalized("8901030895564") == "8901030895564")
    }
}

struct DecodingTests {
    static let json = """
    {"status":"success","cached":false,"timestamp":"2026-09-13T00:00:00Z","data":{
      "id":"c2e1","barcode":"8901030895564","country":"IN","product_name":"Aloo Bhujia","brand":"Haldiram's",
      "image_url":"https://images.example/a.jpg",
      "nutrition_facts":{"energy_kcal":546,"protein":"9.2","carbs":43.8,"fat":36.4,"sugar":null,"sodium":1.18},
      "ingredients":"Gram flour, palm oil, potato","allergens":"en:peanuts,en:milk","source":"open_food_facts",
      "verified":false,"verification_count":1,"additives":["E330","E500II"],"nova_group":4,"nutriscore_grade":"d",
      "is_vegan":true,"is_vegetarian":true,"is_palm_oil_free":false,"category":"namkeen"}}
    """.data(using: .utf8)!

    private struct Envelope: Decodable { var data: Product? }

    static func decode() throws -> Product {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return try #require(try d.decode(Envelope.self, from: json).data)
    }

    @Test func decodesBackendShape() throws {
        let p = try Self.decode()
        #expect(p.name == "Aloo Bhujia")
        #expect(p.imageURL?.host() == "images.example")
        #expect(p.nutrition.energyKcal == 546)
        #expect(p.nutrition.protein == 9.2)        // string number tolerated
        #expect(p.nutrition.sugar == nil)          // null tolerated
        #expect(p.nutrition.sodiumMg == 1180)
        #expect(p.additives == ["E330", "E500II"])
        #expect(p.healthScore == 45)               // d (-40) + nova 4 (-15)
    }

    @Test func snapshotRoundTrips() throws {
        let p = try Self.decode()
        let data = try JSONEncoder().encode(p)
        let back = try JSONDecoder().decode(Product.self, from: data)
        #expect(back == p)
    }

    @Test func emptyNutritionDecodes() throws {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        let json = #"{"barcode":"1","product_name":"X","nutrition_facts":{},"source":"user_contributed"}"#.data(using: .utf8)!
        let p = try d.decode(Product.self, from: json)
        #expect(p.nutrition.isEmpty)
        #expect(p.isCommunitySourced)
        #expect(p.healthScore == nil)
    }
}

struct PersonalCheckTests {
    @Test func flagsProblemsFirstAndAdmitsUnknowns() throws {
        let p = try DecodingTests.decode()
        let checks = PersonalCheck.run([.peanutAllergy, .noPalmOil, .vegetarian, .lowSugar, .lactoseSensitive], on: p)
            .sorted { $0.status.rank < $1.status.rank }
        #expect(checks.map(\.preference).prefix(2).allSatisfy { [.peanutAllergy, .noPalmOil].contains($0) })
        #expect(checks.first { $0.preference == .peanutAllergy }?.status == .avoid)
        #expect(checks.first { $0.preference == .vegetarian }?.status == .good)
        #expect(checks.first { $0.preference == .lowSugar }?.status == .unknown)
        #expect(checks.first { $0.preference == .lactoseSensitive }?.status == .caution)
    }

    @Test func prefsRoundTrip() {
        let set: Set<DietaryPreference> = [.jain, .lowSodium]
        #expect(DietaryPreference.decode(DietaryPreference.encode(set)) == set)
        #expect(DietaryPreference.decode("").isEmpty)
    }
}

struct AdditiveTests {
    @Test func classifiesByRange() {
        #expect(Additive.kind(of: "E150D") == "Colour")
        #expect(Additive.kind(of: "E211") == "Preservative")
        #expect(Additive.kind(of: "E330") == "Antioxidant · acidity regulator")
        #expect(Additive.kind(of: "E621") == "Flavour enhancer")
        #expect(Additive.kind(of: "E1442") == "Modified starch · other")
    }
}

struct OCRHeuristicTests {
    @Test func parsesIngredientsAndAllergens() {
        let raw = "Nutella\nIngredients: Sugar, Palm Oil, Hazelnuts 13%, Cocoa.\nContains MILK, SOY.\nBest before 12/2027"
        #expect(LabelOCR.parseIngredients(raw) == "Sugar, Palm Oil, Hazelnuts 13%, Cocoa")
        #expect(LabelOCR.detectAllergens(raw) == ["Milk", "Soy"])
        #expect(LabelOCR.guessName(raw) == "Nutella")
    }
}
