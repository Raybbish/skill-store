# Mermaid Site-Map Templates

Copy-paste-ready Mermaid diagrams for visual sitemaps. Customize node labels and connections. Paste into any Mermaid renderer.

---

## Basic Hierarchy

```mermaid
graph TD
    HOME["Homepage<br/>/"] --> FEAT["Features<br/>/features"]
    HOME --> PRICE["Pricing<br/>/pricing"]
    HOME --> BLOG["Blog<br/>/blog"]
    HOME --> ABOUT["About<br/>/about"]

    FEAT --> F1["Analytics<br/>/features/analytics"]
    FEAT --> F2["Automation<br/>/features/automation"]
    BLOG --> B1["SEO Guide<br/>/blog/seo-guide"]
```

---

## Hierarchy with Navigation Zones

Subgraphs show which pages appear in which navigation area.

```mermaid
graph TD
    subgraph "Header Nav"
        HOME["Homepage"]
        FEAT["Features"]
        PRICE["Pricing"]
        BLOG["Blog"]
        CTA["Get Started ★"]
    end

    subgraph "Footer Nav"
        ABOUT["About"]
        CONTACT["Contact"]
        PRIVACY["Privacy"]
    end

    HOME --> FEAT
    HOME --> PRICE
    HOME --> BLOG
    HOME --> ABOUT
    FEAT --> F1["Analytics"]
    FEAT --> F2["Automation"]
    ABOUT --> CONTACT
```

---

## Hub-and-Spoke Content Model

Hub page connected to spokes; spokes cross-link and link back to the hub.

```mermaid
graph TD
    HUB["SEO Guide<br/>(Hub / Pillar)"]
    HUB --> S1["Keyword Research"]
    HUB --> S2["On-Page SEO"]
    HUB --> S3["Technical SEO"]
    S1 -.-> S2
    S2 -.-> S3
    S1 --> HUB
    S2 --> HUB
    S3 --> HUB
    style HUB fill:#9C27B0,color:#fff
```

Legend: solid = hub↔spoke links; dashed = cross-links between spokes.

---

## Orphans and Islands (the diagnostic view)

This is the map that earns the skill its keep. Put orphans (no inbound edges) in their own subgraph. An **island** is a cluster that links among its own members but never back to a pillar — mark it red.

```mermaid
graph TD
    subgraph "Main Structure"
        HOME["Homepage"] --> FEAT["Features"]
        HOME --> BLOG["Blog"]
        FEAT --> F1["Analytics"]
        BLOG --> B1["Post: SEO"]
    end

    subgraph "Island (links only to itself)"
        I1["Old Campaign A"] --> I2["Old Campaign B"]
        I2 --> I1
    end

    subgraph "Orphans (no inbound links)"
        O1["Legacy Promo"]
        O2["Forgotten Landing Page"]
    end

    style I1 fill:#f44336,color:#fff
    style I2 fill:#f44336,color:#fff
    style O1 fill:#FFC107
    style O2 fill:#FFC107
```

Color key: **red** = island (reconnect to a pillar or retire); **yellow** = orphan (add inbound links, noindex, or 301).

---

## Before/After Restructuring

```mermaid
graph TD
    subgraph "Before — flat sprawl"
        B_HOME["Homepage"] --> B_P1["Page 1"]
        B_HOME --> B_P2["Page 2"]
        B_HOME --> B_P3["Page 3"]
        B_HOME --> B_P4["Page 4"]
    end

    subgraph "After — grouped"
        A_HOME["Homepage"] --> A_S1["Features"]
        A_HOME --> A_S2["Resources"]
        A_S1 --> A_P1["Feature A"]
        A_S2 --> A_P3["Blog"]
    end
```

---

## Color-Coding Conventions

```mermaid
graph TD
    HOME["Homepage"] --> FEAT["Features"]
    HOME --> NEW["New Section"]
    HOME --> REMOVE["Deprecated Page"]
    style HOME fill:#4CAF50,color:#fff
    style FEAT fill:#4CAF50,color:#fff
    style NEW fill:#2196F3,color:#fff
    style REMOVE fill:#f44336,color:#fff
```

Key: **green** = existing (no change); **blue** = new page to create; **red** = remove/redirect; **yellow** = orphan/restructure; **purple** = hub or CTA.
