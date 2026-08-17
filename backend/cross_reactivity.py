# Local rule-based cross-reactivity lookup, checked before falling back to an
# AI call. Groups reflect documented allergy/immunology cross-reactivity
# syndromes (Latex-Fruit, Oral Allergy Syndrome, etc.), not guesses.

CROSS_REACTIVITY_GROUPS = [
    {
        "name": "Latex-Fruit Syndrome",
        "allergens": ["latex", "banana", "avocado", "kiwi", "chestnut", "papaya", "tomato", "bell pepper", "passion fruit"],
    },
    {
        "name": "Birch Pollen-Food Syndrome (Oral Allergy Syndrome)",
        "allergens": ["birch pollen", "apple", "peach", "cherry", "pear", "plum", "apricot", "hazelnut", "almond", "carrot", "celery", "kiwi", "soy"],
    },
    {
        "name": "Ragweed-Melon Syndrome",
        "allergens": ["ragweed", "watermelon", "cantaloupe", "honeydew", "zucchini", "cucumber", "banana"],
    },
    {
        "name": "Grass Pollen-Food Syndrome",
        "allergens": ["grass pollen", "tomato", "melon", "orange", "peanut", "potato"],
    },
    {
        "name": "Mugwort-Spice Syndrome",
        "allergens": ["mugwort", "celery", "carrot", "fennel", "coriander", "cumin", "black pepper", "sunflower seed", "garlic"],
    },
    {
        "name": "Shellfish-Mollusk Cross-Reactivity",
        "allergens": ["shrimp", "crab", "lobster", "crayfish", "clam", "oyster", "mussel", "scallop", "squid", "dust mite"],
    },
    {
        "name": "Tree Nut Cross-Reactivity",
        "allergens": ["walnut", "pecan", "cashew", "pistachio", "almond", "hazelnut", "brazil nut", "macadamia", "tree nuts"],
    },
    {
        "name": "Legume Cross-Reactivity",
        "allergens": ["peanut", "peanuts", "soy", "lentil", "chickpea", "pea", "lupin"],
    },
    {
        "name": "Fish Cross-Reactivity",
        "allergens": ["fish", "salmon", "tuna", "cod", "halibut", "sardine", "anchovy"],
    },
]


def infer_local_cross_reactive_risks(user_allergens):
    """Given the user's confirmed/high-risk allergens, return other allergens
    that could be cross-reactive based on known syndrome groups. Each result:
    {allergen, risk_level, based_on_group, matched_triggers}.
    risk_level is "high" when 2+ of the user's allergens land in the same
    group, "low" when only 1 does."""
    user_set = {a.lower() for a in user_allergens}
    best_by_allergen = {}

    for group in CROSS_REACTIVITY_GROUPS:
        group_allergens = set(group["allergens"])
        matched = sorted(user_set & group_allergens)
        if not matched:
            continue

        risk_level = "high" if len(matched) >= 2 else "low"
        candidates = group_allergens - user_set

        for candidate in candidates:
            existing = best_by_allergen.get(candidate)
            if existing is None or (risk_level == "high" and existing["risk_level"] == "low"):
                best_by_allergen[candidate] = {
                    "allergen": candidate,
                    "risk_level": risk_level,
                    "based_on_group": group["name"],
                    "matched_triggers": matched,
                }

    return list(best_by_allergen.values())


def get_uncovered_allergens(user_allergens):
    """Allergens from the user's list that don't appear in any local group —
    these are what get handed to the AI fallback."""
    user_set = {a.lower() for a in user_allergens}
    all_local_allergens = set()
    for group in CROSS_REACTIVITY_GROUPS:
        all_local_allergens.update(group["allergens"])
    return user_set - all_local_allergens
