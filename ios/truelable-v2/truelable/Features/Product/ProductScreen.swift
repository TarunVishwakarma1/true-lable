//
//  ProductScreen.swift
//  truelable
//
//  The result. Ordered the way a shopper actually decides: verdict → what
//  it means for *you* → the numbers → the fine print → what else is on the
//  shelf → help keep it honest. Every section hides itself when the data
//  behind it doesn't exist.
//

import SwiftUI

struct ProductScreen: View {
    @State private var product: Product
    let inSheet: Bool

    @AppStorage(Keys.dietary) private var dietaryRaw = ""

    init(product: Product, inSheet: Bool = false) {
        _product = State(initialValue: product)
        self.inSheet = inSheet
    }

    private var checks: [PersonalCheck] {
        PersonalCheck.run(DietaryPreference.decode(dietaryRaw), on: product)
            .sorted { $0.status.rank < $1.status.rank }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                hero
                VerdictCard(product: product)
                if !checks.isEmpty {
                    ForYouCard(checks: checks)
                }
                MacroCard(product: product)
                if let sugar = product.nutrition.sugar {
                    SugarCard(sugarGrams: sugar)
                }
                if !product.nutrition.isEmpty {
                    LabelCard(product: product)
                }
                if let ingredients = product.ingredients {
                    IngredientsCard(text: ingredients)
                }
                if !product.additives.isEmpty {
                    AdditivesCard(codes: product.additives)
                }
                if let allergens = product.allergens {
                    AllergensCard(raw: allergens)
                }
                AlternativesCard(product: product, prefs: DietaryPreference.decode(dietaryRaw))
                CommunityCard(product: $product)
                footer
            }
            .padding(.horizontal, TL.gutter)
            .padding(.top, 8)
            .padding(.bottom, 40)
        }
        .scrollIndicators(.hidden)
        .screenBackground()
        .navigationTitle(inSheet ? "" : product.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: product.shareSummary) {
                    Image(systemName: "square.and.arrow.up")
                }
            }
            if inSheet { CloseButton() }
        }
    }

    private var hero: some View {
        HStack(alignment: .top, spacing: 16) {
            ProductThumb(url: product.imageURL, size: 92, radius: 24)
            VStack(alignment: .leading, spacing: 8) {
                if let brand = product.brand {
                    Eyebrow(text: brand)
                }
                Text(product.name)
                    .font(.title2.weight(.bold))
                    .tracking(-0.4)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 6) {
                    if product.verified {
                        Pill(text: "Verified", color: TL.accent, icon: "checkmark.seal.fill", filled: true)
                    } else if product.isCommunitySourced {
                        Pill(text: "Community", color: TL.warn, icon: "person.2.fill")
                    } else {
                        Pill(text: "Open Food Facts", color: TL.fg2, icon: "globe")
                    }
                }
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, 8)
    }

    private var footer: some View {
        VStack(spacing: 4) {
            Text(product.barcode)
                .font(.caption.monospaced())
                .foregroundStyle(TL.fg3)
            Text("Values per 100 g as published by the source. Always check the pack.")
                .font(.caption2)
                .foregroundStyle(TL.fg3)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 12)
    }
}

#Preview {
    NavigationStack {
        ProductScreen(product: Product(
            barcode: "8901030895564", name: "Aloo Bhujia", brand: "Haldiram's",
            nutrition: {
                var n = Nutrition()
                n.energyKcal = 546; n.protein = 9.2; n.carbs = 43.8; n.fat = 36.4
                n.saturatedFat = 12; n.sugar = 2.4; n.sodium = 1.18; n.fiber = 3
                return n
            }(),
            ingredients: "Gram flour, edible vegetable oil (palm), potato, salt, spices, red chilli, acidity regulator (E330)",
            allergens: "en:none",
            additives: ["E330", "E500II"], novaGroup: 4, nutriscoreGrade: "d",
            isVegan: true, isVegetarian: true, isPalmOilFree: false
        ))
    }
    .preferredColorScheme(.dark)
}
