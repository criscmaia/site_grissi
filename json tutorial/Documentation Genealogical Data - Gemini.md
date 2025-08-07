## Documentation: Genealogical Data Extraction to JSON

### 1\. Objective

The primary objective is to parse the genealogical text file `arvore completa_texto puro_20250806_v2.txt` and convert it into a single, structured, and complete JSON file. This process must accurately capture all individuals and their relationships as detailed in the source text, accounting for its specific formatting and inconsistencies.

-----

### 2\. Core Principles & Constraints

  * **Single Source of Truth**: All information must be derived exclusively from the `arvore completa_texto puro_20250806_v2.txt` file. No external data should be used.
  * **Complete Data Representation**: The final JSON output must contain a record for every individual mentioned with a generational ID in the source file.
  * **Handling Missing Data**: If a piece of information (e.g., a death date, a parent's name) is not present in the text for a given individual, the corresponding JSON field must be set to `null`.
  * **Source Citation Removal**: The source file uses citation markers like \`\`. These are to be ignored and must not be included in the final JSON output.
  * **Observations Field**: The `observations` field for every individual in the final JSON must be set to `null`. Do not populate it with any text.

-----

### 3\. Source File Analysis

#### 3.1. Keywords and Patterns

The parser must recognize the following patterns to extract data for an individual:

| Keyword / Pattern | Signifies |
| :--- | :--- |
| `[PREFIX] - [ID] [NAME]` | The start of a new family member's main entry (e.g., `BN - 1.1.3.2.1. ARMANDO CANTON`). The ID is the unique identifier. |
| `Nascido em` / `Nascida em` | Indicates **gender** (male/female), **birth date**, and **birth location**. |
| `Falecido em` / `Falecida em` | Indicates **death date** and sometimes **death location**. |
| `Filho de` / `filha de` | Indicates the names of the **father** and **mother**. |
| `Casou-se com` / `Casou-se em` | Defines a formal **partner** and often the **marriage date**. This marks the beginning of a **union**. |
| `passou a assinar` | Indicates a **legal name change** for an individual or their partner. |
| `Tiveram X filhos:` | Signals a list of children belonging to the **immediately preceding union**. |
| `Filho de [Other Parent]` | When found in a child's record, this pattern identifies that child's *other parent*, defining a specific union for that child if not already formalized by a `Casou-se com` block. |

#### 3.2. Structural Challenges & Edge Cases

The parsing logic must be robust enough to handle the following known issues in the source file:

  * **Inconsistent ID Numbering**: The source text contains typographical errors in the IDs (e.g., a child's ID does not correctly extend the parent's ID). The parser **must not** blindly trust the written ID. The ID for each individual should be taken as written, but the parent-child relationship must be established by parsing the `Filho de...` text, not by comparing ID numbers.
  * **Ambiguous Block Endings**: An individual's data block does not have a formal end marker. The block of information for one person ends **only** when a line starting with the next person's generational ID is encountered.
  * **Multiple & Informal Unions**: An individual may have children with multiple partners. These unions must be grouped correctly. A union is defined by a unique pair of parents. All children sharing the exact same two parents belong to the same union, whether that union is defined by a `Casou-se com` entry or implicitly by multiple children listing the same "other parent."

-----

### 4\. JSON Output Specification

#### 4.1. Root Object

The output must be a single JSON object with two top-level keys: `metadata` and `familyMembers`.

#### 4.2. `metadata` Object

```json
"metadata": {
  "extractionDate": "YYYY-MM-DDTHH:MM:SSZ",
  "sourceFile": "arvore completa_texto puro_20250806_v2.txt",
  "totalMembers": 440,
  "generations": 7
}
```

#### 4.3. `familyMembers` Object Structure

This is an array of objects, where each object represents one individual.

```json
{
  "id": "QN - 1.1.3.8.1.2.2",
  "name": "CRISTIANO CARDOSO MAIA",
  "legalName": null,
  "nameChanges": [],
  "generation": 6,
  "gender": "male",
  "birthDate": "26/03/1989",
  "birthLocation": "Belo Horizonte, MG",
  "deathDate": null,
  "deathLocation": null,
  "parents": {
    "father": "GLEISSON MIRANDA MAIA",
    "mother": "CARINA GRISSI CARDOSO"
  },
  "unions": [],
  "relationships": {
    "siblings": [
      "QN - 1.1.3.8.1.2.1"
    ]
  },
  "observations": null
}
```

  * **`id`**: (String) The unique identifier, including prefixes (e.g., "F -", "QN -").
  * **`name`**: (String) The full name of the person.
  * **`legalName`**: (String/null) The person's name after a legal change.
  * **`nameChanges`**: (Array) An array of objects detailing name changes.
  * **`generation`**: (Integer) Calculated by counting the dot-separated segments in the numeric part of the ID and subtracting 1. (e.g., `1.1.3.8` has 4 segments -\> generation 3).
  * **`gender`**: (String/null) "male" or "female".
  * **`parents`**: (Object) Contains the string names of the father and mother.
  * **`unions`**: (Array) A list of objects, where each represents a relationship with a partner and the children from that union.
  * **`relationships`**: (Object) Contains a `siblings` array of IDs.
  * **`observations`**: (String/null) **This field must always be `null`**.

#### 4.4. `unions` Object Structure

```json
"unions": [
  {
    "partner": {
      "name": "ZULMIRA MARZANO MOREIRA",
      "legalName": "ZULMIRA MOREIRA GRISSI",
      "birthDate": "11/01/1913",
      "birthLocation": "Entre Rios de Minas, MG",
      "deathDate": "19/08/1999",
      "marriageDate": "18/06/1938",
      "parents": {
        "father": "FRANCISCO AUGUSTO MOREIRA",
        "mother": "MARIA MARZANO MOREIRA"
      }
    },
    "children": [
      { "id": "BN - 1.1.3.8.1", "name": "TEREZINHA MOREIRA GRISSI" },
      { "id": "BN - 1.1.3.8.2", "name": "MARIA DE LOURDES MOREIRA GRISSI" }
    ]
  }
]
```

-----

### 5\. Step-by-Step Processing Logic

To ensure complete and accurate processing, a **two-phase approach** is mandatory. This prevents parsing errors from causing premature termination.

#### **Phase 1: Flat Extraction (Data Ingestion)**

The goal of this phase is to read the entire text file and create a preliminary, flat list of every individual without trying to connect them yet.

1.  **Initialize**: Create an empty list, `flat_person_list`.
2.  **Iterate Document**: Read the `arvore completa_texto puro_20250806_v2.txt` file line by line from beginning to end.
3.  **Identify Individuals**: Use a regular expression to identify every line that marks the beginning of a person's entry (e.g., `^([A-Z]{1,2}\s?-\s?)?([\d\.]+) (.*)$`).
4.  **Extract Self-Contained Data**: For each person identified, parse the subsequent lines to extract only their direct, self-contained information:
      * `id`, `name`
      * `birthDate`, `birthLocation`, `gender` (from `Nascido/a em`)
      * `deathDate`, `deathLocation` (from `Falecido/a em`)
      * `parents` (father and mother names as strings from `Filho/a de`)
      * Any formally declared partner's information (from `Casou-se com`).
5.  **Append to List**: Add the created person object to the `flat_person_list`.
6.  **Completion**: Continue until the end of the file is reached. At the end of this phase, you must have a list containing a preliminary object for every one of the **440** individuals.

#### **Phase 2: Relationship Assembly (In-Memory Processing)**

The goal of this phase is to use the complete `flat_person_list` from Phase 1 to build the nested relationships. **Do not read from the source file in this phase.**

1.  **Initialize Final List**: Create an empty list, `final_family_members`.
2.  **Iterate Flat List**: For each `person` object in the `flat_person_list`:
3.  **Populate Siblings**: Initialize `person.relationships.siblings` as an empty array. Iterate through the entire `flat_person_list` again. For any other `sibling_candidate` where `sibling_candidate.parents.father` and `sibling_candidate.parents.mother` are identical to the current `person`'s parents (and the IDs are different), add the `sibling_candidate.id` to the `person.relationships.siblings` array.
4.  **Populate Unions & Children**:
      * Initialize `person.unions` as an empty array.
      * Create a temporary dictionary, `unions_map`, to group children by their other parent.
      * Iterate through the entire `flat_person_list` one more time to find all children of the current `person`. A `child_candidate` is a child if their `parents` object contains the current `person.name`.
      * For each `child` found, identify the name of the "other parent".
      * Use the "other parent's" name as the key in `unions_map`. If the key doesn't exist, create a new union object for that partner. Add the `child` (`{id, name}`) to the children list under that key.
      * After iterating through all potential children, convert the `unions_map` dictionary into the final `person.unions` array.
5.  **Finalize**: Add the fully processed `person` object to the `final_family_members` list.
6.  **Repeat**: Continue until every person from the `flat_person_list` has been processed.

### 6\. Final Assembly

1.  **Calculate Metadata**: Once the `final_family_members` list is complete, calculate `totalMembers` (the length of the list) and `generations` (the maximum generation found).
2.  **Construct Root Object**: Assemble the final JSON object with the `metadata` and the `final_family_members` array.
3.  **Output**: Provide the complete, single JSON file as the final output.