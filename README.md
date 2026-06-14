# SEC Risk Analyzer using BERTopic

## Overview

SEC Risk Analyzer is an NLP-based financial analysis system that automatically extracts, analyzes, and compares risk disclosures from SEC 10-K filings. The project focuses on the **Risk Factors (Item 1A)** section of annual filings and uses **BERTopic** to identify risk themes, track their evolution over time, and compare risk disclosures across companies.

The system helps analysts, auditors, investors, and researchers answer questions such as:

* What are the major risks disclosed by a company?
* Which risks are emerging or disappearing over time?
* Which industry-standard risks are missing from a company's disclosures?
* Which risks are emphasized more heavily compared to competitors?

---

## Problem Statement

Manual analysis of SEC filings presents several challenges:

* 10-K filings are often hundreds of pages long.
* Risk disclosures are unstructured and difficult to analyze at scale.
* Comparing risk narratives across multiple years requires significant effort.
* Important changes in risk emphasis may go unnoticed.

This project addresses these challenges by providing an automated pipeline for extracting and analyzing risk themes using Natural Language Processing and Topic Modeling.

---

## Features

### Company-Level Analysis

* Extract Risk Factors (Item 1A) from SEC filings
* Identify key risk themes
* Analyze risk emphasis through topic frequency
* Detect emerging risks
* Detect disappearing risks

### Cross-Company Analysis

* Compare company risk profiles against industry peers
* Identify missing risks
* Identify dominant risks
* Measure industry alignment

### Temporal Analysis

* Compare risk disclosures across years
* Track changes in risk priorities
* Analyze risk narrative evolution

### Explainable Outputs

* Topic keywords
* Representative risk statements
* Topic frequencies
* Similarity scores
* Alignment metrics

---

## System Architecture

```text
SEC Filing
    │
    ▼
Risk Factors Extraction
    │
    ▼
Text Preprocessing
    │
    ▼
Chunking
    │
    ▼
Sentence Embeddings
    │
    ▼
BERTopic
 ┌───────────────┐
 │ UMAP          │
 │ HDBSCAN       │
 │ c-TF-IDF      │
 └───────────────┘
    │
    ▼
Topic Assignment
    │
    ▼
Risk Analysis Engine
    │
    ├── Emerging Risks
    ├── Disappearing Risks
    ├── Missing Risks
    ├── Industry Alignment
```

---

## Project Structure

```text
sec-risk-analyzer/
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── embeddings/
│
├── notebooks/
│   ├── 01_data_collection.ipynb
│   ├── 02_preprocessing_embeddings.ipynb
│   ├── 03_topic_modeling.ipynb
│   └── 04_similarity_analysis.ipynb
│
├── artifacts/
│   ├── topic_data/
│   ├── topics.csv
│   ├── enriched_data.pkl
│   └── topic_embeddings.npy
│
├── models/
│   └── bertopic_model/
│
├── app/
│   ├── streamlit_app.py
│   └── components/
│
├── src/
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── embeddings.py
│   ├── topic_modeling.py
│   ├── similarity.py
│   └── metrics.py
│
├── requirements.txt
└── README.md
```

---

## Methodology

### 1. Data Collection

SEC 10-K filings are downloaded using the Edgar API.

**Target Section:**

```text
Item 1A – Risk Factors
```

This section contains management's disclosures of operational, financial, strategic, technological, and regulatory risks.

---

### 2. Preprocessing

The extracted text is cleaned through:

* HTML removal
* Whitespace normalization
* Formatting cleanup
---

### 3. Chunking

Long filings often contain multiple risk themes.

Instead of treating the entire filing as a single document, the text is divided into paragraph-based chunks.

#### Benefits

* Better topic granularity
* Improved clustering
* More interpretable topics
* Reduced context mixing
---

### 4. Embeddings

Each chunk is converted into a semantic vector using all-mpnet-base-v2 Sentence Transformer.

Embeddings capture semantic meaning rather than simple keyword overlap.

Example:

```text
"Supply chain disruption"
"Logistics network failure"
```

These statements are placed close together in vector space despite using different words.

---

### 5. Topic Modeling with BERTopic

BERTopic combines three major components:

#### UMAP

Dimensionality reduction.

Purpose:

* Reduce computational complexity
* Preserve semantic relationships
* Improve clustering performance

#### HDBSCAN

Density-based clustering.

Purpose:

* Automatically determine clusters
* Handle variable cluster sizes
* Detect noise and outliers

#### c-TF-IDF

Class-based TF-IDF.

Purpose:

* Extract representative topic keywords
* Improve topic interpretability

---

## Topic Analysis

Each chunk receives a topic assignment.

Example:

```python
{
    "ticker": "AAPL",
    "year": 2024,
    "topic": 5,
    "chunk": "Supply chain disruptions..."
}
```

Topic frequencies are then computed and analyzed.

---

## Metrics

### Emerging Risks

Risks whose frequency increases significantly compared to previous years.

```text
freq_new > freq_old × growth_threshold
```

---

### Disappearing Risks

Risks whose frequency decreases significantly compared to previous years.

```text
freq_new < freq_old × drop_threshold
```

---

### Missing Risks

Topics common in industry peers but absent or underrepresented in the selected company.

---

## Inference Workflow

```text
User Selects Company
        │
        ▼
Fetch Latest Filing
        │
        ▼
Preprocess Text
        │
        ▼
Chunk Text
        │
        ▼
Generate Embeddings
        │
        ▼
BERTopic.transform()
        │
        ▼
Assign Existing Topics
        │
        ▼
Generate Risk Analysis
```

No retraining occurs during inference, enabling fast response times and consistent topic assignments.

---

## Technologies Used

### NLP & Topic Modeling

* BERTopic
* Sentence Transformers
* UMAP
* HDBSCAN

### Data Processing

* Pandas
* NumPy
* Pickle

### SEC Data Extraction

* Edgar API

### Visualization

* Matplotlib
* Plotly
* Streamlit

### Development Environment

* Google Colab
* Google Drive

---

## Limitations

* Topic modeling is unsupervised and does not provide traditional classification accuracy.
* Topic quality depends on chunking strategy.
* Novel risks may be assigned to the closest existing topic during inference.
* Topic frequency is an approximation of risk importance.

---

## Future Work

* MD&A section analysis
* Sentiment analysis
* Quarterly filing (10-Q) support
* Retrieval-Augmented Generation (RAG)
* Automated risk summarization using LLMs
* Interactive dashboards and benchmarking tools

---
