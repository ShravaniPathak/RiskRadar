from app.utils.load_model import get_bert_model, get_enriched_data
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter


def max_similarity(topic_id, other_topic_ids, topic_embeddings):
    if not other_topic_ids:
        return 0

    sims = cosine_similarity(
        topic_embeddings[topic_id].reshape(1, -1),
        topic_embeddings[other_topic_ids]
    )

    return sims.max()

def get_topics(ticker, year, docs):
    return set([
        item["topics"]
        for item in docs
        if item["ticker"] == ticker
        and item["year"] == year
        and item["topics"] != -1
    ])

def get_other_company_counts(ticker, year):
    enriched_data = get_enriched_data()
    if enriched_data is None:
        raise Exception("Can't load enriched_data")
    topics = [
        item["topic"]
        for item in enriched_data
        if item["ticker"] != ticker
        and item["year"] == year
        and item["topic"] != -1
    ]
    return Counter(topics)

def get_topics_enriched(ticker, year):
    enriched_data = get_enriched_data()
    return set([
        item["topic"]
        for item in enriched_data
        if item["ticker"] == ticker
        and item["year"] == year
        and item["topic"] != -1
    ])

def disappearing_risks(docs, threshold=0.8):
    topics_1 = set(docs[0].get("topics") if docs[0].get("year") < docs[1].get("year") else docs[1].get("topics"))
    topics_2 = set(docs[0].get("topics") if docs[0].get("year") > docs[1].get("year") else docs[1].get("topics"))

    topic_model = get_bert_model()
    if topic_model is None:
        raise Exception("Cannot load bertopic")
    topic_embeddings = topic_model.topic_embeddings_

    disappearing = []

    for t1 in topics_1:
        sim = max_similarity(t1, list(topics_2), topic_embeddings)

        if sim < threshold:
            disappearing.append(t1)

    return disappearing

def disappearing_with_drop(docs, drop_ratio=0.7):
    topics_1 = docs[0].get("topics") if docs[0].get("year") < docs[1].get("year") else docs[1].get("topics")
    topics_2 = docs[0].get("topics") if docs[0].get("year") > docs[1].get("year") else docs[1].get("topics")

    counts1 = Counter(topics_1)
    counts2 = Counter(topics_2)

    disappearing = []

    for topic in counts1:
        freq1 = counts1[topic]
        freq2 = counts2.get(topic, 0)

        if freq2 < freq1 * drop_ratio:
            disappearing.append((topic, freq1, freq2))

    return disappearing

def emerging_with_growth(ticker, year1, year2, growth_ratio=1.3):
    counts1 = get_topics_enriched(ticker, year1)
    counts2 = get_topics_enriched(ticker, year2)

    emerging = []

    for topic in counts2:
        freq2 = counts2[topic]
        freq1 = counts1.get(topic, 0)

        if freq1 == 0:
            emerging.append((topic, freq1, freq2, "new"))

        elif freq2 > freq1 * growth_ratio:
            emerging.append((topic, freq1, freq2, "growth"))

    return emerging

def missing_with_drop_vs_others(ticker, year, drop_ratio=0.3):
    target_counts = get_topics_enriched(ticker, year)
    other_counts = get_other_company_counts(ticker, year)

    missing = []

    for topic in other_counts:
        freq_other = other_counts[topic]
        freq_target = target_counts.get(topic, 0)

        if freq_target < freq_other * drop_ratio:
            missing.append((topic, freq_other, freq_target))

    return missing

def emerging_vs_others_growth(ticker, year, growth_ratio=1.5):
    target_counts = get_topics_enriched(ticker, year)
    other_counts = get_other_company_counts(ticker, year)

    emerging = []

    for topic in target_counts:
        freq_target = target_counts[topic]
        freq_other = other_counts.get(topic, 0)

        if freq_other == 0:
            emerging.append((topic, freq_other, freq_target, "unique"))

        elif freq_target > freq_other * growth_ratio:
            emerging.append((topic, freq_other, freq_target, "dominant"))

    return emerging
