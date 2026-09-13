//
//  APIClient.swift
//  truelable
//
//  Every backend call in one place, on one URLSession, with one error
//  type. Mirrors backend/src/routes/v1 exactly:
//    GET  /api/v1/products/search?barcode&country
//    GET  /api/v1/products/query?q&country&limit
//    GET  /api/v1/products/trending?country&limit
//    GET  /api/v1/products/alternatives?barcode&country&sort_by&limit
//    GET  /api/v1/products/needs-verification?country&device_id&limit
//    POST /api/v1/products/verify   {barcode, country, device_id}
//    POST /api/v1/ocr/submit        {barcode, country, extracted_text, reviewed_ingredients,
//                                    reviewed_allergens, product_name?, brand?, nutrition?}
//

import Foundation
import UIKit

enum APIError: LocalizedError {
    case notFound
    case offline
    case server(Int)
    case invalid

    var errorDescription: String? {
        switch self {
        case .notFound: "Not in the catalogue yet"
        case .offline: "Couldn't reach TrueLabel. Check your connection and try again."
        case .server(let code): "The server had a problem (HTTP \(code)). Try again in a moment."
        case .invalid: "That response didn't make sense. Try again."
        }
    }
}

enum API {
    private static let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 15
        config.timeoutIntervalForResource = 30
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: config)
    }()

    private static let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        return d
    }()

    private static let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()

    /// Backend defaults to IN; match it when the device has no region.
    static var country: String { Locale.current.region?.identifier ?? "IN" }
    static var deviceID: String? { UIDevice.current.identifierForVendor?.uuidString }

    // MARK: Endpoints

    static func product(barcode: String) async throws -> Product {
        let env: Envelope<Product> = try await get("api/v1/products/search", ["barcode": barcode, "country": country])
        guard let p = env.data else { throw APIError.notFound }
        return p
    }

    static func search(_ q: String, limit: Int = 20) async throws -> [ProductCard] {
        let env: Envelope<[ProductCard]> = try await get("api/v1/products/query", ["q": q, "country": country, "limit": "\(limit)"])
        return env.data ?? []
    }

    static func trending(limit: Int = 10) async throws -> [ProductCard] {
        let env: Envelope<[ProductCard]> = try await get("api/v1/products/trending", ["country": country, "limit": "\(limit)"])
        return env.data ?? []
    }

    static func alternatives(barcode: String, sortBy: String, limit: Int = 3) async throws -> [ProductCard] {
        let env: Envelope<[ProductCard]> = try await get("api/v1/products/alternatives", [
            "barcode": barcode, "country": country, "sort_by": sortBy, "limit": "\(limit)"
        ])
        return env.data ?? []
    }

    static func verify(barcode: String) async throws -> Product {
        struct Body: Encodable { var barcode: String; var country: String; var deviceId: String? }
        let env: Envelope<Product> = try await post("api/v1/products/verify", Body(barcode: barcode, country: country, deviceId: deviceID))
        guard let p = env.data else { throw APIError.invalid }
        return p
    }

    static func needsVerification(limit: Int = 12) async throws -> [Candidate] {
        var q = ["country": country, "limit": "\(limit)"]
        if let deviceID { q["device_id"] = deviceID }
        let env: Envelope<[Candidate]> = try await get("api/v1/products/needs-verification", q)
        return env.data ?? []
    }

    struct LabelSubmission: Encodable {
        var barcode: String
        var country: String
        var extractedText: String
        var reviewedIngredients: String
        var reviewedAllergens: [String]
        var productName: String?
        var brand: String?
        var nutrition: Nutrition?
    }

    static func submitLabel(_ submission: LabelSubmission) async throws {
        struct Reply: Decodable { var guessedName: String? }
        let _: Reply = try await post("api/v1/ocr/submit", submission)
    }

    // MARK: Plumbing

    private struct Envelope<T: Decodable>: Decodable {
        var status: String
        var data: T?
    }

    private static func get<T: Decodable>(_ path: String, _ query: [String: String]) async throws -> T {
        var components = URLComponents(url: APIEnvironment.baseURL.appending(path: path), resolvingAgainstBaseURL: false)!
        components.queryItems = query.sorted { $0.key < $1.key }.map { URLQueryItem(name: $0.key, value: $0.value) }
        return try await run(URLRequest(url: components.url!))
    }

    private static func post<T: Decodable>(_ path: String, _ body: some Encodable) async throws -> T {
        var request = URLRequest(url: APIEnvironment.baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        return try await run(request)
    }

    private static func run<T: Decodable>(_ request: URLRequest) async throws -> T {
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            // Every transport failure (no network, timeout, DNS, TLS) reads
            // the same to the person holding the phone.
            throw APIError.offline
        }
        guard let http = response as? HTTPURLResponse else { throw APIError.invalid }
        switch http.statusCode {
        case 200..<300:
            do { return try decoder.decode(T.self, from: data) } catch { throw APIError.invalid }
        case 404:
            throw APIError.notFound
        default:
            throw APIError.server(http.statusCode)
        }
    }
}

/// A product as it appears in any list — search, trending, alternatives.
struct ProductCard: Decodable, Identifiable, Hashable, Sendable {
    var id: String { barcode }
    var barcode: String
    var productName: String
    var brand: String?
    var imageUrl: String?
    var nutriscoreGrade: String?
    var novaGroup: Int?
    var verified: Bool
    var energyKcal: Double?
    var sugar: Double?
    var sodium: Double?
    var sortValue: Double?

    var imageURL: URL? { imageUrl.flatMap(URL.init(string:)) }
}

struct Candidate: Decodable, Identifiable, Hashable, Sendable {
    var id: String { barcode }
    var barcode: String
    var productName: String
    var brand: String?
    var imageUrl: String?
    var nutriscoreGrade: String?
    var energyKcal: Double?
    var sugar: Double?
    var sodium: Double?
    var verificationCount: Int

    var imageURL: URL? { imageUrl.flatMap(URL.init(string:)) }
}
