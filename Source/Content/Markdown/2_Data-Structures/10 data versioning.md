# Chapter 10: Data Versioning

**Data versioning** is the practice of identifying and managing different states of data and recording how they relate. It lets us retrieve an earlier state, explain a change, and identify exactly which data an analysis used.

Data versioning is an application of data structures. A list can hold successive versions, a dictionary can find a version by its identifier, and a graph can connect versions with their sources.

![Saved revision sheets preserve the marks history; an earlier report still uses r1 and mean 75.](../../../Assets/Data%20Structures/Static/versioning-overview.svg)

## Learning Objectives
## Contents

- [Learning Objectives](#learning-objectives)
- [1. Why keep earlier versions?](#1-why-keep-earlier-versions)
- [2. Revision and release](#2-revision-and-release)
- [3. The six data versioning principles](#3-the-six-data-versioning-principles)
- [4. More than a sequence of edited files](#4-more-than-a-sequence-of-edited-files)
- [5. How data structures organise version history](#5-how-data-structures-organise-version-history)
- [6. Storing full snapshots or changes](#6-storing-full-snapshots-or-changes)
- [7. Python example: preserve and retrieve snapshots](#7-python-example-preserve-and-retrieve-snapshots)
- [8. A practical versioning workflow](#8-a-practical-versioning-workflow)
- [9. Practice activities](#9-practice-activities)
- [References](#references)


After this topic, you should be able to:

- Explain why data versioning supports reproducibility and collaboration.
- Distinguish a revision, a release, a format variant, and a mirrored copy.
- Describe the six data versioning principles.
- Trace a version history using lists, dictionaries, and graphs.
- Compare full snapshots with stored changes and retrieve an earlier snapshot in Python.

**Before starting:** review [linked lists](04%20linked%20lists.md), [trees](08%20trees.md), and [graphs](09%20graphs.md). The Python example uses lists, dictionaries, loops, and functions.

## 1. Why keep earlier versions?

Suppose a club records three students' quiz marks. Each student ID identifies one record.

| Student ID | Revision r1 | Revision r2 | Revision r3 |
| --- | ---: | ---: | ---: |
| S01 | 70 | 70 | 70 |
| S02 | 80 | 85 | 85 |
| S03 | Not recorded | Not recorded | 90 |

In `r2`, the club corrects S02's mark. In `r3`, it adds S03's result. If each update overwrites the only copy, someone reading an earlier report cannot recover the data behind its calculation.

- The mean for `r1` is `(70 + 80) / 2 = 75`.
- The mean for `r2` is `(70 + 85) / 2 = 77.5`.
- The mean for `r3` is `(70 + 85 + 90) / 3`, approximately `81.67`.

**Reproducibility** means being able to repeat an analysis using the same inputs and method. A report that records `r1` can explain its mean of `75`, even after newer data appear. Versioning supports this, but reproducing a complete analysis may also require its code, parameters, and software environment.

A backup provides a recoverable copy. Versioning also identifies states and their relationships. A backup of only the latest file cannot explain which earlier state produced a result.

## 2. Revision and release

A **revision** is a changed instance of a dataset that is separately identified. At the technical level, a revision records a change in the **bitstream**, the sequence of bytes making up a digital object. Detecting that the bytes changed does not explain whether the content or only its representation changed. A **release** is a selected revision published for reuse through an editorial process. Not every revision becomes a release.

![Snapshot sheets move from working data into the archive; r1 and r3 have release labels.](../../../Assets/Data%20Structures/Animated/versioning-revisions.svg)

[Static version for print](../../../Assets/Data%20Structures/Static/versioning-revisions.svg)

Here, `r2` is an internal correction. The club publishes `r3` as release `1.1` after checking the correction and new record. An arrow means that the later revision was made from the earlier one. Release labels identify selected revisions; they do not require duplicate copies of the data.

**Release notes** explain what changed, why it changed, and what it means for users. For example:

> Release 1.1: Corrected S02's mark from 80 to 85 and added S03's mark of 90. The mean is now approximately 81.67 rather than 75. Earlier reports using release 1.0 used only S01 and S02 before the correction.

The labels `1.0` and `1.1` are a local convention for this example. Teams should document what their labels mean. The significance of a data change depends on its intended use; a small numerical correction can have a large effect on a conclusion.

## 3. The six data versioning principles

The six principles help identify changes, explain their significance, and trace the relationships between datasets.

| Principle | Question it answers | Student-marks example |
| --- | --- | --- |
| **Revision** | Which changed instance is this? | Give the correction its own ID, `r2`. |
| **Release** | Which revision is published, and why does the change matter? | Publish `r3` as `1.1` with release notes. |
| **Granularity** | Are we identifying a whole collection or a particular part? | Identify the class dataset and specify whether an analysis used only S01 and S02. |
| **Manifestation** | Is this a different format of the same data product? | Offer the same records as CSV and JSON. |
| **Provenance** | Where did the data come from, and how were they changed? | Record that `r2` came from `r1` after checking S02's original answer sheet. |
| **Citation** | How can someone identify and credit the data used? | Record the creator, dataset title, exact release, provider, and persistent identifier when available. |

![An open notebook defines Revision, Release, Granularity, Manifestation, Provenance, and Citation.](../../../Assets/Data%20Structures/Static/versioning-principles.svg)

A **persistent identifier (PID)** is an identifier intended to remain usable over time. A DOI is one type. An internal revision ID and a public PID serve different purposes: naming a revision `r3` does not itself provide a lasting public reference. For very large collections, persistent identifiers for individual objects can be assigned on demand.

Granularity includes identifying and versioning a collection and its constituent datasets at a level appropriate to users' needs. For example, a collection of class-results datasets should identify which version of each class dataset it contains. Identifying a subset of rows, as in the table above, is another granularity choice.

![A collection folder contains Class A r2 and Class B r1; a table selects S02 from Class A r2.](../../../Assets/Data%20Structures/Static/versioning-granularity.svg)

## 4. More than a sequence of edited files

The Functional Requirements for Bibliographic Records (FRBR), now part of the IFLA Library Reference Model (LRM), provides a library-based framework for explaining relationships that ordinary revision numbers do not fully describe. It distinguishes four levels: Work, Expression, Manifestation, and Item.

| Level | Meaning in these notes | Example |
| --- | --- | --- |
| **Work** | The overall intellectual creation or purpose | The club's quiz-results data project |
| **Expression** | A particular data product realising that work | The checked student-marks table |
| **Manifestation** | A format embodying that product | CSV or JSON containing the same records and values |
| **Item** | A particular instance or copy | The CSV file on the club's server |

![Folded CSV and JSON sheets encode the same records; location labels identify their hosted copies.](../../../Assets/Data%20Structures/Static/versioning-formats.svg)

**Citing the Expression** credits the data product's creators. **Referencing the Item** identifies the accessed copy and its provider. With mirrored data, record the authoritative product and the copy used clearly so that access through a mirror does not obscure the original source.

Changing S02's mark changes the data content. Converting a table from CSV to JSON without losing information creates a different manifestation. Copying the same CSV to another server creates another item. These relationships should be documented so users can distinguish a correction from a format conversion or mirror.

A **checksum** is a value calculated from a file's bytes to help detect changes. CSV and JSON representations normally have different checksums even when they represent the same records. A checksum comparison alone cannot explain the meaning or significance of a difference.

![Two folded files encode the same marks but display different SHA-256 fingerprints.](../../../Assets/Data%20Structures/Static/versioning-checksums.svg)

**Metadata** describes data, such as its title, creator, and available formats. Correcting a catalogue description does not necessarily change the data itself. Catalogue changes and data revisions are distinct. Metadata versioning practices vary, and there is no consensus on implementing metadata versioning in aggregators. Make clear whether an identifier refers to the dataset or to its metadata record.

## 5. How data structures organise version history

The structures below are implementation choices for learning. The appropriate structure depends on the operations a system needs.

### 5.1 Lists and links: a linear history

A list can store revisions in order: `[r1, r2, r3]`. A separate parent reference can link each revision to its predecessor, like links between nodes in a linked list.

![A reader pointer follows the actual parent links from r3 to r2 to r1 while the visited output accumulates.](../../../Assets/Data%20Structures/Animated/versioning-parent-trace.svg)

[Static version for print](../../../Assets/Data%20Structures/Static/versioning-parent-trace.svg)

This is useful for displaying history or tracing how the current state arose. Reaching a much older revision by following links requires visiting the intervening revisions. Storing a history in a list does not automatically make every revision's data immutable: the contents must also be protected from accidental changes.

### 5.2 Dictionaries: lookup by identifier

A **dictionary** maps a key to a value. For a version store, the key can be `r2` and the value can contain its parent ID, data, author, and change note.

| Key | Parent | Change note |
| --- | --- | --- |
| r1 | None | Initial marks |
| r2 | r1 | Correct S02's mark |
| r3 | r2 | Add S03's mark |

![The r2 row in a key-value dictionary identifies a saved record with parent r1 and the corrected marks.](../../../Assets/Data%20Structures/Static/versioning-lookup.svg)

A hash-based dictionary provides expected constant-time lookup by revision ID. Copying or reading the entire stored dataset still takes time proportional to its size. Fast identification and fast retrieval of all data are different operations.

### 5.3 Trees and graphs: branches and merges

A **branch** lets someone develop a different line of changes from an existing revision. If each revision has at most one parent, a branching history can form a rooted tree. A **merge** combines lines of work and can give a revision more than one parent. The following is a separate example, using IDs `b1` to `b4` rather than the earlier linear history.

![Revision b1 branches into b2 and b3. Their changes merge into b4, which has two parents.](../../../Assets/Data%20Structures/Static/versioning-branches.svg)

The edges are `b1 -> b2`, `b1 -> b3`, `b2 -> b4`, and `b3 -> b4`. Starting with S01 = 70 and S02 = 80 in `b1`, branch `b2` corrects S02 to 85, while branch `b3` adds S03 = 90 and leaves S02 at 80. Revision `b4` combines both changes.

This history is a **directed acyclic graph (DAG)**: edges have a direction, and no directed path returns to its starting node. It is not a tree because `b4` has two parents. A dictionary of parent lists can store it:

```python
parents = {"b1": [], "b2": ["b1"], "b3": ["b1"], "b4": ["b2", "b3"]}
```

The branching diagram follows changes forward from parent to child. The dictionary stores references in the opposite direction, from each child to its parents, for tracing ancestry.

A graph records relationships; it does not decide whether a merge is correct. If two branches change S02's mark to different values, the conflict needs a decision based on evidence. Parent links also provide only part of provenance: record the source, processing method, and responsible person where relevant.

## 6. Storing full snapshots or changes

A **snapshot** stores the complete dataset state. A **delta** stores changes relative to another state, such as “set S02 to 85.” These are storage strategies, separate from the six principles.

| Strategy | What is stored | Benefit | Cost |
| --- | --- | --- | --- |
| Full snapshots | Complete data for each revision | Read a revision without replaying earlier changes | Repeated unchanged data can use substantial space |
| Base snapshot plus deltas | An initial state and later changes | Can save space when changes are small | Reconstructing a revision requires its base and the needed changes |
| Periodic snapshots plus deltas | Occasional full states and changes between them | Can shorten reconstruction chains | Requires managing both snapshots and changes |

![Proportional bars compare 100 GB of snapshots with 1.099 GB for a base plus deltas.](../../../Assets/Data%20Structures/Static/versioning-storage.svg)

For the marks example, store the base `{S01: 70, S02: 80}`, then the delta “set S02 to 85,” then “add S03 with 90.” Reconstructing `r3` from that base applies both deltas in order.

If every full snapshot contains about `n` records and there are `v` revisions, full-copy storage is approximately `O(vn)`. A base plus deltas uses approximately `O(n + D)`, where `D` is the total size of recorded changes, excluding metadata and indexing overhead. Deltas are not always smaller, and full-copy storage is not required by data versioning.

**Quick check.** If a required delta is lost, can the later state always be reconstructed from the original base?

**Expected answer.** No. The missing change can make reconstruction incomplete unless another snapshot or recovery copy supplies the needed state.

## 7. Python example: preserve and retrieve snapshots

This in-memory example implements the linear history from the first table. Each revision stores a full snapshot. Dictionaries make revision lookup simple; parent IDs record the chain. All dataset values here are integers, so a shallow dictionary copy is sufficient.

```python
versions = {}


def save_version(version_id, data, parent, note):
    if version_id in versions:
        raise ValueError("Revision ID already exists")
    if parent is not None and parent not in versions:
        raise ValueError("Parent revision does not exist")
    versions[version_id] = {
        "parent": parent,
        "data": data.copy(),
        "note": note,
    }


def get_data(version_id):
    # Return a copy so editing the result does not change the saved snapshot.
    return versions[version_id]["data"].copy()


marks = {"S01": 70, "S02": 80}
save_version("r1", marks, None, "Initial marks")

marks["S02"] = 85
save_version("r2", marks, "r1", "Correct S02's mark")

marks["S03"] = 90
save_version("r3", marks, "r2", "Add S03's mark")

releases = {"1.0": "r1", "1.1": "r3"}
earlier = get_data(releases["1.0"])
print("Release 1.0:", earlier)
print("Mean:", sum(earlier.values()) / len(earlier))

current_id = "r3"
while current_id is not None:
    print(current_id, versions[current_id]["note"])
    current_id = versions[current_id]["parent"]
```

Expected output:

```text
Release 1.0: {'S01': 70, 'S02': 80}
Mean: 75.0
r3 Add S03's mark
r2 Correct S02's mark
r1 Initial marks
```

![A read copy of r1 moves into an analysis workspace while the original stays saved; the report reproduces mean 75.](../../../Assets/Data%20Structures/Animated/application-versioning.svg)

[Static version for print](../../../Assets/Data%20Structures/Static/application-versioning.svg)

Without `data.copy()` when saving, each stored revision would refer to the same mutable `marks` dictionary. Later edits would then alter what earlier revisions appear to contain. With nested lists or dictionaries, a shallow copy would still share nested objects; use an appropriate deeper-copy or immutable-data strategy.

![An edit enters the working dictionaries; a shared saved reference reads 85 while an independent copy keeps 80.](../../../Assets/Data%20Structures/Animated/versioning-copy-safety.svg)

[Static version for print](../../../Assets/Data%20Structures/Static/versioning-copy-safety.svg)

This example loses its data when the program stops and permits direct edits to `versions`. A real system needs durable storage and controls that preserve recorded history. The example demonstrates snapshots and references, rather than a complete version-control service.

## 8. A practical versioning workflow

A small student project can follow these steps.

1. **Agree on identifiers and labels.** Use a consistent naming scheme. Systematic filenames with ISO-style dates, such as `marks_2026-11-06_r1.csv`, are a simple starting point. Include an extra identifier if several revisions can occur on one day.
2. **Record revisions and provenance.** Preserve earlier states and document who changed what, why, and from which source. Git can manage revisions of small files, while Data Version Control (DVC) can help manage larger data files.
3. **Check a selected revision before releasing it.** Give the release an unambiguous label and explain its changes and implications in release notes.
4. **Identify the data actually used.** Record the release and, when needed, the exact subset. For changing data, a query alone may return different results later; preserve or reconstruct the historical state as well.
5. **Describe formats and copies.** List available format variants and connect mirrored copies to the authoritative source.
6. **Keep references understandable when access changes.** If data become unavailable, their PID should still resolve to a metadata landing page. If both data and metadata are unavailable, it should resolve to a **tombstone page**, a notice explaining the unavailable resource. Explain retractions in release notes.

![A paper checklist covers preserving revisions, checking a release, and documenting precise reuse.](../../../Assets/Data%20Structures/Static/versioning-workflow.svg)

For an AI project, record the training-data version alongside the processing code, model settings, and results. Comparing models trained on different datasets without recording that difference can make the source of a performance change unclear.

![An experiment sheet records its training-data version, code revision, settings, and outputs.](../../../Assets/Data%20Structures/Static/versioning-ai-lineage.svg)

## 9. Practice activities

### 9.1 Trace the earlier state

Using the marks table, a report says its mean is `75`. Another student recalculates using `r3` and gets approximately `81.67`. Explain the difference and identify what the report should record.

**Answer.** The report used `r1`, before S02's correction and S03's addition. The calculations use different inputs. The report should identify `r1` or release `1.0`, the records included, and the calculation method so someone can repeat it.

### 9.2 Classify the relationship

For each case, explain what changed:

1. S02's mark is corrected from 80 to 85.
2. The same records are exported to JSON with all values preserved.
3. The unchanged CSV is copied to another university server.
4. A spelling error in the catalogue description is corrected; the data file is unchanged.

**Answers.** (1) A data revision; the team separately decides whether to publish a new release. (2) A new manifestation of the same data product. (3) Another item, or mirrored copy, which should refer to the authoritative source. (4) A metadata correction; distinguish the metadata record from the data object rather than assuming both changed.

### 9.3 Choose a structure

A project needs to retrieve a revision by ID and also record a merge with two parents. Which structures from this chapter could it combine?

**Answer.** Use a dictionary keyed by revision ID for lookup and store a list of parent IDs in each revision record. Those parent lists represent the edges of a directed history graph. A single predecessor link cannot represent both parents of the merge.

### 9.4 Find the bug

A programmer replaces `"data": data.copy()` with `"data": data` in `save_version`. What will `get_data("r1")` contain after all three saves?

**Answer.** `{'S01': 70, 'S02': 85, 'S03': 90}`. All revisions reference the same dictionary, which was changed in place. Copying only when retrieving cannot repair the already altered history.

### 9.5 Compare storage choices

A dataset is about 1 GB and has 100 saved states. Each change after the initial state is about 1 MB. Estimate storage for full snapshots and for a base plus 99 deltas. Ignore compression and metadata; use `1 GB = 1,000 MB` for this exercise. Explain one tradeoff.

**Answer.** Full snapshots use approximately `100 GB`. A base plus deltas uses `1,000 + 99 = 1,099 MB`, or approximately `1.099 GB`. Deltas save space under these assumptions, but retrieving a later state may require replaying many changes. A periodic snapshot can reduce that work.


## References

1. Klump, J., Wyborn, L., Wu, M., Martin, J., Downs, R. R., and Asmi, A. (2021). [Versioning Data Is About More than Revisions: A Conceptual Framework and Proposed Principles](https://doi.org/10.5334/dsj-2021-012). *Data Science Journal*, 20, article 12, pp. 1-13. Source for revision/release distinctions, the FRBR framework, and the six principles.
2. Klump, J., Wyborn, L., Wu, M., Strecker, D., Pampel, H., and Rothfritz, L. (2026). [What Do We Mean by 'Version'? Actionable Guidelines for the Versioning of Data](https://doi.org/10.5334/dsj-2026-037). *Data Science Journal*, 25, article 37, pp. 1-17. Source for practical recommendations, format variants, mirroring, citation, and metadata considerations.
