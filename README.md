
#  The Gossip Garden

### A Living Index of Algorithmic Amplification

---

##  Concept

**The Gossip Garden** visualises the economic logic of online scandal.

On social media platforms, gossip is not simply casual conversation — it is measurable, monetisable and optimised.

By analysing public posts containing keywords such as:

* *celebrity scandal*
* *cheating*
* *exposed*
* *cancel*
* *drama*

the system generates a real-time **Gossip Index**.

This index feeds a generative plant that grows, mutates, and develops sharper structures according to levels of negativity and engagement.

The project asks:

> Is toxicity merely user behaviour, or is it algorithmically cultivated?
> Does engagement equal value?
> Are we being trained to prefer outrage?

---

##  System Structure

###  Data Layer (Node.js)

The server:

* Fetches public posts via API
* Extracts:

  * Post count
  * Like / retweet / comment count
  * Sentiment score
  * Toxicity score (if available)
* Computes a dynamic **Gossip Index**

### Gossip Index Formula (example)

```
Gossip Index = 
(negative sentiment × interaction volume × post frequency) 
/ time window
```

The index updates periodically and is pushed to the frontend.

⚠ No usernames are stored.
⚠ No raw text is stored.
⚠ Only aggregated numerical metrics are processed.

---

##  Visual System: Data → Plant

The Gossip Garden is a living visual metaphor.

| Data Input           | Visual Behaviour    |
| -------------------- | ------------------- |
| Post volume          | Trunk height        |
| Engagement           | Branch density      |
| Negativity           | Sharpness of growth |
| Toxicity             | Thorn formation     |
| Sudden spikes        | Bloom / glow event  |
| Sustained high value | Root expansion      |

The plant does not reset when switching keywords.
Previous plants remain on screen — forming a layered ecology of algorithmic memory.

---

##  Visual Language

Aesthetic direction:

* Dreamlike glow
* Mist diffusion
* Star-like bursts
* Grain texture
* Soft pastel / grey tonalities
* Low contrast haze
* Floating particle field

Background evolved through iteration:

* Initial simple gradient
* Replaced with multi-layer watercolor diffusion
* Added saturation control and blur diffusion
* Introduced grain and fibre noise for materiality

Plant style evolved from:

* Line-based generative branches
  → Surface-based glowing forms
  → ASCII dot-matrix botanical texture

Each topic generates a slightly different grey tone and growth direction, suggesting that algorithmic amplification produces structurally similar yet distinct emotional ecosystems.

---

## Iterative Development

### Phase 1 – Linear Branch System

Basic Perlin-noise driven plant growth mapped to engagement data.

### Phase 2 – Surface & Glow

Replaced line strokes with filled forms and luminous outlines to increase organic presence.

### Phase 3 – Background Revision

* Added watercolor diffusion blobs
* Increased saturation
* Introduced soft blur layers
* Embedded granular paper texture
* Added floating star particles

### Phase 4 – Persistence Mechanism

Plants no longer reset when a new keyword is selected.
The garden accumulates growth — representing how algorithmic systems layer attention over time.

### Phase 5 – ASCII Botanical Texture

Surface replaced by typographic dot structures to reference:

* Data materiality
* Platform infrastructure
* Computational aesthetics

---

## Technical Stack

**Backend**

* Node.js
* Express
* API fetch
* Sentiment analysis
* Periodic index calculation

**Frontend**

* p5.js generative system
* Perlin noise growth algorithm
* Glow effects via canvas shadow blur
* Procedural watercolor background
* ASCII-based rendering
* Real-time updates (WebSocket-ready architecture)

**Deployment**

* GitHub repository
* Render Web Service hosting
* Public access via:


---

## ⚖ Ethics & GDPR Compliance

This project follows strict data responsibility principles:

* Only publicly available posts are analysed.
* No usernames are stored.
* No raw text is stored.
* No user identifiers are archived.
* Only aggregated statistical metrics are processed.
* Data is refreshed and not permanently stored.

All personal data is anonymised and not retained.

The project critiques algorithmic amplification without exposing individuals.

---

##  Critical Framing

Inspired by:

* Tactical Tech – data literacy and algorithmic power
* Platform capitalism theory
* Research on outrage amplification
* Forensic and investigative visual culture

The work suggests:

> Toxicity may not simply be a social failure —
> it may be a systemic optimisation strategy.

The garden grows because platforms reward intensity.

---

##  Why a Garden?

A garden implies cultivation.

If toxicity grows faster than care,
we must ask:

Who is watering it?

---

