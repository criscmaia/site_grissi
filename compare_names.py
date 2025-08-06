import csv
import json
import sys

def load_csv_names(filename):
    """Load names from CSV file"""
    names = set()
    with open(filename, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            if 'Full Name' in row and row['Full Name'].strip():
                names.add(row['Full Name'].strip())
    return names

def load_json_names(filename):
    """Load names from JSON file"""
    names = set()
    with open(filename, 'r', encoding='utf-8') as file:
        data = json.load(file)
        
    # Extract names from familyMembers array
    for member in data.get('familyMembers', []):
        if 'name' in member and member['name'].strip():
            names.add(member['name'].strip())
            
        # Also check spouse names
        for family in member.get('families', []):
            if 'spouse' in family and 'name' in family['spouse']:
                spouse_name = family['spouse']['name'].strip()
                if spouse_name:
                    names.add(spouse_name)
    
    return names

def compare_names(csv_names, json_names):
    """Compare names and return missing ones"""
    missing_names = csv_names - json_names
    return sorted(list(missing_names))

def main():
    csv_file = 'Familia_Grissi_Corrigido.csv'
    json_file = 'family-data-final.json'  # Use the final JSON file
    
    print("Loading names from CSV file...")
    csv_names = load_csv_names(csv_file)
    print(f"Found {len(csv_names)} names in CSV file")
    
    print("Loading names from JSON file...")
    json_names = load_json_names(json_file)
    print(f"Found {len(json_names)} names in JSON file")
    
    print("\nComparing names...")
    missing_names = compare_names(csv_names, json_names)
    
    print(f"\nNames from CSV that are NOT in JSON ({len(missing_names)}):")
    print("=" * 50)
    
    if missing_names:
        for i, name in enumerate(missing_names, 1):
            print(f"{i:3d}. {name}")
    else:
        print("All names from CSV are present in JSON!")
    
    print(f"\nSummary:")
    print(f"- Total names in CSV: {len(csv_names)}")
    print(f"- Total names in JSON: {len(json_names)}")
    print(f"- Missing names: {len(missing_names)}")
    print(f"- Coverage: {((len(csv_names) - len(missing_names)) / len(csv_names) * 100):.1f}%")

if __name__ == "__main__":
    main()
