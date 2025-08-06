import csv
import json
import sys
import os
from pathlib import Path

def safe_load_csv_names(filename):
    """Load names from CSV file with error handling"""
    try:
        print(f"Attempting to load CSV file: {filename}")
        if not os.path.exists(filename):
            print(f"ERROR: CSV file {filename} not found!")
            return set()
        
        names = set()
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row_num, row in enumerate(reader, 1):
                try:
                    if 'Full Name' in row and row['Full Name'].strip():
                        name = row['Full Name'].strip()
                        names.add(name)
                        if row_num <= 5:  # Show first 5 names for verification
                            print(f"  Sample name {row_num}: {name}")
                except Exception as e:
                    print(f"  Warning: Error processing row {row_num}: {e}")
        
        print(f"Successfully loaded {len(names)} names from CSV")
        return names
    except Exception as e:
        print(f"ERROR loading CSV: {e}")
        return set()

def safe_load_json_names(filename):
    """Load names from JSON file with error handling"""
    try:
        print(f"Attempting to load JSON file: {filename}")
        if not os.path.exists(filename):
            print(f"ERROR: JSON file {filename} not found!")
            return set()
        
        names = set()
        with open(filename, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        print(f"JSON loaded successfully. Structure: {list(data.keys())}")
        
        # Extract names from familyMembers array
        family_members = data.get('familyMembers', [])
        print(f"Found {len(family_members)} family members in JSON")
        
        for i, member in enumerate(family_members):
            try:
                if 'name' in member and member['name'].strip():
                    name = member['name'].strip()
                    names.add(name)
                    if i < 5:  # Show first 5 names for verification
                        print(f"  Sample member {i+1}: {name}")
                
                # Also check spouse names
                families = member.get('families', [])
                for family in families:
                    if 'spouse' in family and 'name' in family['spouse']:
                        spouse_name = family['spouse']['name'].strip()
                        if spouse_name:
                            names.add(spouse_name)
                            
            except Exception as e:
                print(f"  Warning: Error processing member {i+1}: {e}")
        
        print(f"Successfully extracted {len(names)} unique names from JSON")
        return names
    except Exception as e:
        print(f"ERROR loading JSON: {e}")
        return set()

def compare_names(csv_names, json_names):
    """Compare names and return missing ones"""
    missing_names = csv_names - json_names
    return sorted(list(missing_names))

def main():
    print("=== ROBUST FAMILY DATA COMPARISON ===")
    print()
    
    # Check current directory and files
    current_dir = os.getcwd()
    print(f"Current directory: {current_dir}")
    print(f"Files in directory: {[f for f in os.listdir('.') if f.endswith(('.csv', '.json'))]}")
    print()
    
    csv_file = 'Familia_Grissi_Corrigido.csv'
    json_file = 'family-data-final.json'
    
    print("Step 1: Loading CSV names...")
    csv_names = safe_load_csv_names(csv_file)
    if not csv_names:
        print("ERROR: No names loaded from CSV. Exiting.")
        return
    
    print("\nStep 2: Loading JSON names...")
    json_names = safe_load_json_names(json_file)
    if not json_names:
        print("ERROR: No names loaded from JSON. Exiting.")
        return
    
    print("\nStep 3: Comparing names...")
    missing_names = compare_names(csv_names, json_names)
    
    print(f"\n=== RESULTS ===")
    print(f"Names from CSV that are NOT in JSON ({len(missing_names)}):")
    print("=" * 50)
    
    if missing_names:
        for i, name in enumerate(missing_names, 1):
            print(f"{i:3d}. {name}")
    else:
        print("🎉 All names from CSV are present in JSON!")
    
    print(f"\n=== SUMMARY ===")
    print(f"- Total names in CSV: {len(csv_names)}")
    print(f"- Total names in JSON: {len(json_names)}")
    print(f"- Missing names: {len(missing_names)}")
    if len(csv_names) > 0:
        coverage = ((len(csv_names) - len(missing_names)) / len(csv_names) * 100)
        print(f"- Coverage: {coverage:.1f}%")
        
        if coverage == 100.0:
            print("🎉 ACHIEVED 100% COVERAGE!")
        elif coverage >= 95.0:
            print("✅ Excellent coverage achieved!")
        elif coverage >= 90.0:
            print("✅ Good coverage achieved!")
        else:
            print("⚠️  Coverage needs improvement")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
