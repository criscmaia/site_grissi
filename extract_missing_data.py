import json
import re
from bs4 import BeautifulSoup

def load_json_data(filename):
    """Load existing JSON data"""
    with open(filename, 'r', encoding='utf-8') as file:
        return json.load(file)

def save_json_data(data, filename):
    """Save JSON data"""
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

def extract_person_info(html_content, person_id):
    """Extract information for a specific person from HTML"""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find the person by ID - look for span with class c6 containing the ID
    person_elements = soup.find_all('span', class_='c6')
    
    for element in person_elements:
        if element.get_text().strip() == f"{person_id}.":
            # Found the person, get the name from the next span
            parent = element.parent
            if parent:
                # Look for the name span (usually c13, c12, c3, c24)
                name_spans = parent.find_all('span', class_=['c13', 'c12', 'c3', 'c24'])
                if name_spans:
                    name = name_spans[-1].get_text().strip()
                    
                    # Look for birth/death information in subsequent paragraphs
                    birth_info = ""
                    death_info = ""
                    spouse_info = ""
                    
                    current = parent.find_next_sibling()
                    while current and current.name == 'p':
                        text = current.get_text()
                        if 'Nascido' in text or 'Nascida' in text:
                            birth_info = text
                        elif 'Falecido' in text or 'Falecida' in text:
                            death_info = text
                        elif 'Casou-se' in text:
                            spouse_info = text
                        elif text.strip() and not text.startswith('Tiveram'):
                            break
                        current = current.find_next_sibling()
                    
                    return {
                        'name': name,
                        'birth_info': birth_info,
                        'death_info': death_info,
                        'spouse_info': spouse_info
                    }
    
    return None

def parse_birth_info(birth_text):
    """Parse birth information from text"""
    if not birth_text:
        return {
            'date': "Data não registrada",
            'location': "Data não registrada"
        }
    
    # Extract date and location
    date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', birth_text)
    location_match = re.search(r'em (.+?)(?:\.|,|$)', birth_text)
    
    return {
        'date': date_match.group(1) if date_match else "Data não registrada",
        'location': location_match.group(1) if location_match else "Data não registrada"
    }

def parse_death_info(death_text):
    """Parse death information from text"""
    if not death_text:
        return {
            'date': "Data não registrada",
            'location': "Data não registrada",
            'age': "Data não registrada"
        }
    
    # Extract date, location, and age
    date_match = re.search(r'(\d{1,2}/\d{1,2}/\d{4})', death_text)
    location_match = re.search(r'em (.+?)(?:\.|,|$)', death_text)
    age_match = re.search(r'com (\d+) anos', death_text)
    
    return {
        'date': date_match.group(1) if date_match else "Data não registrada",
        'location': location_match.group(1) if location_match else "Data não registrada",
        'age': int(age_match.group(1)) if age_match else "Data não registrada"
    }

def parse_spouse_info(spouse_text):
    """Parse spouse information from text"""
    if not spouse_text:
        return None
    
    # Extract spouse name
    spouse_match = re.search(r'com (.+?)(?:,|\.|$)', spouse_text)
    if not spouse_match:
        return None
    
    spouse_name = spouse_match.group(1).strip()
    
    # Extract birth info for spouse
    birth_match = re.search(r'nascido em (\d{1,2}/\d{1,2}/\d{4})', spouse_text, re.IGNORECASE)
    birth_location_match = re.search(r'em (.+?)(?:\.|,|$)', spouse_text)
    
    return {
        'name': spouse_name,
        'birth': {
            'date': birth_match.group(1) if birth_match else "Data não registrada",
            'location': birth_location_match.group(1) if birth_location_match else "Data não registrada"
        },
        'death': {
            'date': "Data não registrada",
            'location': "Data não registrada",
            'age': "Data não registrada"
        },
        'parents': {
            'father': "Data não registrada",
            'mother': "Data não registrada"
        }
    }

def add_missing_person_to_json(json_data, person_id, person_info):
    """Add missing person to JSON structure"""
    # Determine generation based on ID depth
    generation = len(person_id.split('.')) + 1
    
    # Determine gender (this is a simplified approach)
    gender = "male"  # Default, would need more sophisticated logic
    
    # Create person object
    person_obj = {
        "id": person_id,
        "name": person_info['name'],
        "generation": generation,
        "gender": gender,
        "birth": parse_birth_info(person_info['birth_info']),
        "death": parse_death_info(person_info['death_info']),
        "parents": {
            "father": "Data não registrada",
            "mother": "Data não registrada"
        },
        "families": [],
        "observations": []
    }
    
    # Add spouse if available
    if person_info['spouse_info']:
        spouse = parse_spouse_info(person_info['spouse_info'])
        if spouse:
            person_obj["families"].append({
                "unionNumber": 1,
                "spouse": spouse,
                "marriageDate": "Data não registrada",
                "endDate": "Data não registrada",
                "children": []
            })
    
    # Add to JSON data
    json_data['familyMembers'].append(person_obj)
    
    return json_data

def main():
    # Load existing JSON data
    json_data = load_json_data('family-data.json')
    
    # Load HTML content
    with open('arvore completa_20250806_v1.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # List of missing person IDs to extract (based on our comparison results)
    missing_ids = [
        "1.1.3.2.6",  # JOÃO
        "1.1.3.2.7",  # NORMA CANTON
        "1.1.3.2.8",  # BEATRIZ CANTON
        "1.1.3.2.9",  # LINDAURA CANTON
        "1.1.3.2.5",  # IZAURO CANTON
        "1.1.3.2.2.1.1",  # VINICIUS CANTON VIDAL
        "1.1.3.2.2.1.2",  # LIGIA CANTON VIDAL
        "1.1.3.2.2.2.1",  # BÁRBARA CRISTINA CANTON GUIMARÃES
        "1.1.3.2.2.2.2",  # JOÃO BATISTA JOSÉ DEOUD GUIMARÃES FILHO
        "1.1.3.2.2.3.1",  # MABILLI SALUTTI DA CRUZ CANTON
        "1.1.3.2.2.3.2",  # GABRIELA SALUTTI DA CRUZ CANTON
        "1.1.3.2.2.4.1",  # EMERSON CANTON CHRISTIANO
        "1.1.3.2.2.4.2",  # ENZO CANTON CHRISTIANO
        "1.1.3.2.3.1",    # JOSÉ ANGELO ALVES DE LIMA
        "1.1.3.2.3.2",    # HELOISA ANGELINA ALVES DE LIMA
        "1.1.3.2.3.3",    # ROGÉRIO ALVES DE LIMA
        "1.1.3.2.4.1",    # MÁRCIO ROBERTO DE OLIVEIRA CANTON
        "1.1.3.2.4.1.1",  # LUCAS CAMPOS CANTON
        "1.1.3.2.4.1.2",  # GIOVANI CAMPOS CANTON
        "1.1.3.2.4.1.3",  # MATEUS CAMPOS CANTON
        "1.1.3.2.5.1",    # MARCOS ROBERTO CANTON
        "1.1.3.2.5.1.1",  # DIOGO BERNINI CANTON
        "1.1.3.2.5.1.2",  # LETICIA BERNINI CANTON
        "1.1.3.2.5.1.3",  # IZADORA BERNINI CANTON
        "1.1.3.2.5.2",    # LUIZA HELENA CANTON
        "1.1.3.2.5.2.1",  # JULIANA CANTON DE LIMA
        "1.1.3.2.5.2.2",  # LUCAS ROBERTO CANTON DE LIMA
        "1.1.3.2.5.2.3",  # GABRIELA CANTON DE LIMA
        "1.1.3.2.5.3",    # ROSANGELA CANTON
        "1.1.3.2.5.4",    # SANDRA CANTON
        "1.1.3.2.5.4.1",  # RAFAELA CANTON CARDOSO
        "1.1.3.2.5.5",    # SOLANGE CANTON
        "1.1.3.2.5.5.1",  # ESTHER CANTON GONÇALVES DUTRA
        "1.1.3.2.5.6",    # VERA LUCIA CANTON
        "1.1.3.2.5.6.1",  # MARIA LUIZA CANTON GUIMARÃES
        "1.1.3.2.5.6.2",  # RAFAEL CANTON GUIMARÃES
        "1.1.3.2.5.6.3",  # THIAGO CANTON GUIMARÃES
        "1.1.3.2.6.1",    # MARCELO
        "1.1.3.2.6.1.1",  # ANA FLAVIA VIEIRA CANTON
        "1.1.3.2.6.1.2",  # MARIA LUIZA CANTON
        "1.1.3.2.6.1.3",  # GABRIEL CANTON
        "1.1.3.2.6.2",    # MARCONE
        "1.1.3.2.6.2.1",  # LARYSSA MUSSI CANTON
        "1.1.3.2.6.3",    # MÁRCIA
        "1.1.3.2.6.4",    # MARCO
        "1.1.3.2.8.1",    # VANESSA CANTON PEREIRA
        "1.1.3.2.8.2",    # LUCIANA CANTON PEREIRA
        "1.1.3.2.9.1",    # CARLOS ALEXANDRE CANTON DE SOUZA
        "1.1.3.2.9.2",    # PATRICIA CANTON DE SOUZA
        "1.1.3.2.9.2.1",  # GUSTAVO CANTON GONÇALVES
        "1.1.3.2.9.2.2",  # TIAGO CANTON GONÇALVES
        "1.1.3.2.9.3",    # SANDRO CANTON DE SOUZA
        "1.1.3.2.9.3.1",  # RAPHAEL SFREDO CANTON DE SOUZA
        "1.1.3.2.9.3.2",  # MATHEUS SFREDO CANTON DE SOUZA
        "1.1.3.2.9.4",    # DANIELA CANTON DE SOUZA
        "1.1.3.2.9.7.2",  # PAULO SÉRGIO GRISSI
        "1.1.3.2.9.7.2.1", # RAFAEL LUCAS GRISSI
        "1.1.3.2.9.8.1",  # RODRIGO GRISSI CANDIAN
        "1.1.3.2.9.8.1.1", # PAOLA BÁRBARA GRISSI CANDIAN
        "1.1.3.2.10.1",   # LINO BERTOLIN
        "1.1.3.2.10.2",   # MAURICIO BERTOLIN
        "1.1.3.2.10.3",   # MARIA HELENA BERTOLIN
        "1.1.3.2.10.4",   # MARIA LÚCIA BERTOLIN
        "1.1.3.2.10.1.1", # RONALDO BERTOLIN
        "1.1.3.2.10.1.2", # RENATA BERTOLIN
        "1.1.3.2.10.1.3", # RITA DE CÁSSIA BERTOLIN
        "1.1.3.2.10.1.4", # LEONARDO BERTOLIN
        "1.1.3.2.10.2.1", # FERNANDA DE FÁTIMA BERTOLIN
        "1.1.3.2.10.2.2", # FABIANA BERTOLIN
        "1.1.3.2.10.2.3", # FLÁVIA BERTOLIN
        "1.1.3.2.10.4",   # MARIA LÚCIA BERTOLIN
        "1.1.3.4.2.2.1",  # HENRIQUE GEISSLER GRISSI
    ]
    
    print("Extracting missing person data...")
    
    for person_id in missing_ids:
        print(f"Processing {person_id}...")
        person_info = extract_person_info(html_content, person_id)
        
        if person_info:
            print(f"  Found: {person_info['name']}")
            json_data = add_missing_person_to_json(json_data, person_id, person_info)
        else:
            print(f"  Not found in HTML")
    
    # Save updated JSON
    save_json_data(json_data, 'family-data-updated.json')
    print(f"\nUpdated JSON saved to family-data-updated.json")
    print(f"Total family members: {len(json_data['familyMembers'])}")

if __name__ == "__main__":
    main()
