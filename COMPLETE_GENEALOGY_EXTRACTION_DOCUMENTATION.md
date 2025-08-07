# Complete Genealogy Data Extraction Documentation

## Overview
This document provides comprehensive instructions for extracting genealogical data from text files and converting it into a structured JSON format. The system handles complex family relationships, multiple unions, legal name changes, and various data formats found in genealogical records.

## Source Data Format
The source text file (`arvore completa_texto puro_20250806_v2.txt`) contains genealogical information in a structured format with:
- Member IDs (e.g., "1.1.3.8.1.3.2")
- Names and descriptions
- Birth/death information
- Marriage details
- Parent information ("Filho de" sections)
- Observations and notes

## JSON Structure

### Core Structure
```json
{
  "metadata": {
    "extractionDate": "2025-08-07T10:30:00.000Z",
    "sourceFile": "arvore completa_texto puro_20250806_v2.txt",
    "totalMembers": 150,
    "generations": 8,
    "extractionMethod": "AI-Powered NLP"
  },
  "familyMembers": [
    {
      "id": "1.1.3.8.1.3.2",
      "name": "SANTIAGO RIBEIRO GRISSI CARDOSO",
      "legalName": "SANTIAGO RIBEIRO GRISSI CARDOSO",
      "nameChanges": [],
      "generation": 6,
      "gender": "male",
      "birthDate": "15/03/1985",
      "birthLocation": "Belo Horizonte, MG",
      "deathDate": null,
      "deathLocation": null,
      "parents": {
        "father": "RODRIGO GRISSI CARDOSO",
        "mother": "MARIA DE FÁTIMA MOREIRA GRISSI"
      },
      "unions": [
        {
          "spouse": "CAROLINA SILVA",
          "marriageDate": "10/06/2010",
          "marriageLocation": "Belo Horizonte, MG",
          "children": ["1.1.3.8.1.3.2.1", "1.1.3.8.1.3.2.2"]
        }
      ],
      "children": ["1.1.3.8.1.3.2.1", "1.1.3.8.1.3.2.2"],
      "observations": [
        "Engenheiro civil",
        "Mora em Belo Horizonte"
      ],
      "relationships": {
        "siblings": ["1.1.3.8.1.3.1", "1.1.3.8.1.3.3"],
        "ancestors": []
      }
    }
  ]
}
```

### Key Fields Explanation

#### Basic Information
- **`id`**: Unique identifier following the genealogical numbering system (e.g., "1.1.3.8.1.3.2")
- **`name`**: Primary name as it appears in the source
- **`legalName`**: Current legal name (may differ from primary name due to name changes)
- **`nameChanges`**: Array of previous names or name change notes
- **`generation`**: Calculated as `(number of digits in ID) - 1`
- **`gender`**: Determined by "Nascido" (male) vs "Nascida" (female) in description

#### Vital Information
- **`birthDate`**: Date of birth (format: DD/MM/YYYY or similar)
- **`birthLocation`**: Place of birth
- **`deathDate`**: Date of death (null if alive)
- **`deathLocation`**: Place of death (null if alive)

#### Family Relationships
- **`parents`**: Object containing father and mother names
- **`unions`**: **CRITICAL FIELD** - Array of marriage/partnership information
- **`children`**: Array of child IDs
- **`relationships`**: Computed relationships (siblings, ancestors)

## Multiple Unions Handling

### Critical Importance
**Multiple unions are the most complex and critical aspect of genealogical data extraction.** A family member may have children with different partners, and this information must be preserved accurately.

### Union Structure
```json
"unions": [
  {
    "partner": {
      "name": "PARTNER_NAME",
      "marriageDate": "DD/MM/YYYY",
      "marriageLocation": "CITY, STATE",
      "legalName": "UPDATED_LEGAL_NAME_AFTER_MARRIAGE",
      "birthDate": "DD/MM/YYYY",
      "birthLocation": "CITY, STATE",
      "father": "PARTNER_FATHER_NAME",
      "mother": "PARTNER_MOTHER_NAME"
    },
    "children": [
      {
        "id": "CHILD_ID_1",
        "name": "CHILD_NAME_1"
      },
      {
        "id": "CHILD_ID_2", 
        "name": "CHILD_NAME_2"
      }
    ]
  }
]
```

### Extraction Logic for Unions
1. **Identify Marriage Sections**: Look for "Casou-se em" patterns
2. **Extract Spouse Information**: Capture full spouse name and details
3. **Match Children to Unions**: Determine which children belong to which union
4. **Handle Multiple Marriages**: Create separate union objects for each marriage
5. **Preserve Chronological Order**: Maintain order of marriages as they appear in source

### Example: Multiple Unions with Complete Partner Information

#### Example 1: LUIGI DI ANGELO GRIZZO (ID: 1.1)
**First Marriage (Primeiras Núpcias):**
- Partner: ELISABETTA PUPPI
- Marriage Date: Not specified in source
- Children: ELISABETHA GIOVANNA PIA (1.1.1), ANTONIO AUGUSTO GRIZZO (1.1.2)

**Second Marriage (Segundas Núpcias):**
- Partner: LUIGIA MORAS
- Marriage Date: 24/05/1885
- Children: GIOVANNI GRIZZO (1.1.3), ROZINA GRIZZO (1.1.4), MARIA GRIZZO (1.1.5)

```json
"unions": [
  {
    "partner": {
      "name": "ELISABETTA PUPPI",
      "marriageDate": null,
      "marriageLocation": null,
      "legalName": null,
      "birthDate": null,
      "birthLocation": "PORCIA/ITALIA",
      "father": null,
      "mother": null
    },
    "children": [
      {
        "id": "1.1.1",
        "name": "ELISABETHA GIOVANNA PIA"
      },
      {
        "id": "1.1.2",
        "name": "ANTONIO AUGUSTO GRIZZO"
      }
    ]
  },
  {
    "partner": {
      "name": "LUIGIA MORAS",
      "marriageDate": "24/05/1885",
      "marriageLocation": null,
      "legalName": null,
      "birthDate": "14/08/1857",
      "birthLocation": "Palse",
      "father": "LUIGI",
      "mother": "FIORINA ROMAN"
    },
    "children": [
      {
        "id": "1.1.3",
        "name": "GIOVANNI GRIZZO"
      },
      {
        "id": "1.1.4",
        "name": "ROZINA GRIZZO"
      },
      {
        "id": "1.1.5",
        "name": "MARIA GRIZZO"
      }
    ]
  }
]
```

#### Example 2: RODRIGO GRISSI CARDOSO (ID: 1.1.3.8.1.3)
**First Union:**
- Partner: MAÍZA MENDES DA NÓBREGA
- Children: GABRIELLA NÓBREGA GRISSI CARDOSO (1.1.3.8.1.3.1)

**Second Union:**
- Partner: ANA PAULA RIBEIRO DA SILVA
- Children: SANTIAGO RIBEIRO GRISSI CARDOSO (1.1.3.8.1.3.2)

```json
"unions": [
  {
    "partner": {
      "name": "MAÍZA MENDES DA NÓBREGA",
      "marriageDate": null,
      "marriageLocation": null,
      "legalName": null,
      "birthDate": null,
      "birthLocation": null,
      "father": null,
      "mother": null
    },
    "children": [
      {
        "id": "1.1.3.8.1.3.1",
        "name": "GABRIELLA NÓBREGA GRISSI CARDOSO"
      }
    ]
  },
  {
    "partner": {
      "name": "ANA PAULA RIBEIRO DA SILVA",
      "marriageDate": null,
      "marriageLocation": null,
      "legalName": null,
      "birthDate": "01/02/1969",
      "birthLocation": "Recife/PE",
      "father": "PAULO RIBEIRO DASILVA",
      "mother": "IONE LARA DA SILVA"
    },
    "children": [
      {
        "id": "1.1.3.8.1.3.2",
        "name": "SANTIAGO RIBEIRO GRISSI CARDOSO"
      }
    ]
  }
]
```

## Data Extraction Logic

### 1. Generation Calculation
```javascript
// Count digits in ID, subtract 1
const generation = id.replace(/\./g, '').length - 1;
// Example: "1.1.3.8.1.3.2" = 7 digits = Generation 6
```

### 2. Gender Detection
```javascript
// Check description for "Nascido" (male) vs "Nascida" (female)
const gender = description.includes("Nascido") ? "male" : "female";
```

### 3. Parent Identification
- **Direct Parent**: Remove last segment from ID (e.g., 1.1.3.8.1.3.2 → 1.1.3.8.1.3)
- **Other Parent**: Extract from "Filho de" section or marriage information
- **Combined Names**: Split by " e " (e.g., "SEBASTIANO GRIZZO e MARIA DE LORENZI")

### 4. Sibling Detection
- Find all members with same base ID structure
- Same number of ID segments (same generation)
- Exclude the person themselves
- Prevent duplicates

### 5. Children Detection
- Find all members whose ID starts with current ID + "."
- Store only child IDs (not full objects)
- Prevent duplicates

### 6. Union Extraction
1. **Find Marriage Sections**: Look for "Casou-se em" patterns, including "primeiras núpcias" and "segundas núpcias"
2. **Extract Partner Details**: 
   - Name from marriage description
   - Marriage date and location
   - Legal name changes after marriage
   - Birth date and location
   - Parent information (father and mother)
3. **Match Children to Unions**: Determine which children belong to which union based on:
   - Explicit statements like "Tiveram dois filhos:" followed by child list
   - Chronological order of marriages and children
   - Parent information in child descriptions
4. **Handle Multiple Unions**: Create separate union objects for each marriage/partnership
5. **Preserve Chronological Order**: Maintain order of unions as they appear in source
6. **Extract Partner Information**: For each partner, capture:
   - Full name
   - Marriage details (date, location)
   - Legal name changes
   - Birth information (date, location)
   - Parent information (father, mother)

## Data Quality Requirements

### Required Fields
- `id`: Must be present and valid format
- `name`: Must be extracted correctly
- `generation`: Must be calculated correctly
- `gender`: Must be determined from description
- `birthDate`: Should be present (may be null for very old records)
- `parents`: Should have at least one parent identified

### Validation Rules
1. **Generation Accuracy**: `generation = (ID digit count) - 1`
2. **Birth Info Quality**: Dates should be meaningful (not "1" or "0")
3. **Parent Consistency**: Combined names should be split
4. **No Duplicates**: Siblings and children should not contain duplicates
5. **Union Completeness**: Each union should have spouse and children info
6. **ID Format**: All IDs should follow the genealogical numbering system

### Common Issues to Avoid
- **Missing Birth Information**: Extract from "Nascido em" patterns
- **Combined Parent Names**: Split "SEBASTIANO GRIZZO e MARIA DE LORENZI"
- **Duplicate Relationships**: Use Sets to prevent duplicates
- **Incorrect Generation**: Always calculate from ID structure
- **Missing Unions**: Ensure all marriages are captured, including "primeiras núpcias" and "segundas núpcias"
- **Wrong Parent Assignment**: Verify parent ID relationships
- **Incomplete Partner Information**: Extract all available partner details (birth, parents, legal name changes)
- **Children-Union Mismatch**: Ensure children are correctly assigned to their biological parents
- **Missing Partner Details**: Capture partner birth information, parent names, and legal name changes

## Extraction Method: AI-Powered NLP

### Why AI Over Regex
1. **Natural Language Understanding**: Better handles varied text formats
2. **Context Awareness**: Understands relationships between different sections
3. **Flexibility**: Adapts to inconsistent formatting
4. **Maintainability**: Easier to modify and extend
5. **Robustness**: Less brittle than complex regex patterns

### AI Extraction Process
1. **Parse Text File**: Read and process the text file content
2. **Split Sections**: Identify individual family member sections
3. **Extract Member Info**: ID, name, generation, gender
4. **Extract Vital Info**: Birth/death dates and locations
5. **Extract Family Info**: Parents, children, unions
6. **Extract Additional Info**: Legal names, observations
7. **Build Relationships**: Compute siblings and ancestors
8. **Validate Data**: Check for completeness and accuracy

### Pattern Recognition
The AI approach uses natural language processing to:
- Recognize birth/death patterns in various formats
- Identify marriage information and partner details
- Understand parent-child relationships
- Distinguish between different types of information
- Handle multiple unions and their children
- Extract legal name changes and observations
- **Recognize Multiple Unions**: Identify "primeiras núpcias", "segundas núpcias", and multiple marriage patterns
- **Extract Partner Information**: Capture complete partner details including birth, parents, and legal name changes
- **Match Children to Unions**: Determine which children belong to which union based on context and chronological order
- **Handle Complex Family Structures**: Process families with children from different partners

## Implementation Guidelines

### File Structure
```
js/
├── ai-genealogy-extractor.js      # Main AI extraction logic
├── genealogy-data-extractor-fixed.js  # Legacy regex approach
└── performance-monitor.js         # Performance monitoring

HTML Files:
├── ai-automated-validator.html    # AI extraction interface
├── test-ai-vs-regex.html         # Comparison tool
└── test-all-data-display.html    # Data visualization
```

### Testing Strategy
1. **Automated Validation**: Check data quality and completeness
2. **Comparison Testing**: Compare AI vs regex results
3. **Manual Verification**: Review sample data for accuracy
4. **Performance Monitoring**: Track extraction speed and accuracy
5. **Error Handling**: Graceful handling of malformed data

### Quality Assurance
- **Comprehensive Validation**: Check all required fields
- **Relationship Verification**: Ensure parent-child consistency
- **Union Completeness**: Verify all marriages are captured, including multiple unions
- **Partner Information Completeness**: Ensure all available partner details are extracted
- **Children-Union Accuracy**: Verify children are correctly assigned to their biological parents
- **Data Deduplication**: Prevent duplicate entries
- **Format Consistency**: Ensure consistent data formats
- **Multiple Union Validation**: Verify that multiple unions are properly separated and documented

## Benefits of This Approach

### Data Completeness
- Captures all family relationships
- Preserves multiple unions accurately with complete partner information
- Maintains chronological order of unions
- Includes legal name changes and partner details
- Preserves biological parent-child relationships across multiple unions

### Data Quality
- Validates generation calculations
- Ensures parent-child consistency
- Prevents duplicate entries
- Maintains data integrity

### Maintainability
- AI approach is more flexible
- Easier to extend and modify
- Better error handling
- More robust to format changes

### User Experience
- Comprehensive data visualization
- Automated validation and fixing
- Clear error reporting
- Downloadable results

## Conclusion

This documentation provides a complete framework for extracting genealogical data from text sources and converting it into structured JSON format. The AI-powered approach, combined with comprehensive validation and the critical handling of multiple unions with complete partner information, ensures accurate and complete family relationship data extraction.

The system is designed to handle the complexities of real genealogical data, including families with children from different partners, while maintaining data quality and providing a robust foundation for family history applications. The detailed partner object structure ensures that all available information about spouses/partners is preserved, including birth details, parent information, and legal name changes.
