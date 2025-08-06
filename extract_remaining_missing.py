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
    json_data = load_json_data('family-data-updated.json')
    
    # Load HTML content
    with open('arvore completa_20250806_v1.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    # List of remaining missing person IDs to extract
    remaining_missing_ids = [
        "1.1.3.7.3",      # CARMEM CANTON
        "1.1.3.8.1",      # TEREZINHA MOREIRA GRISSI
        "1.1.3.8.2",      # MARIA DE LOURDES MOREIRA GRISSI
        "1.1.3.8.3",      # ZAIRA MOREIRA GRISSI
        "1.1.3.8.4",      # ANA MARIA MOREIRA GRISSI
        "1.1.3.8.5",      # MARIA HELENA MOREIRA GRISSI
        "1.1.3.8.6",      # JOÃO FRANCISCO MOREIRA GRISSI
        "1.1.3.8.7",      # MARIA DO CARMO MOREIRA GRISSI
        "1.1.3.8.8",      # MARIA DE FÁTIMA MOREIRA GRISSI
        "1.1.3.9.1",      # DAURA GRISSI
        "1.1.3.9.2",      # JOÃO VICENTE GRISSI
        "1.1.3.9.3",      # DALVA GRISSI
        "1.1.3.9.4",      # DULCE GRISSI
        "1.1.3.9.5",      # MARIA LUIZA GRISSI
        "1.1.3.9.6",      # ANÉZIA JOSEFINA GRISSI
        "1.1.3.9.7",      # JOSÉ FERNANDES GRISSI
        "1.1.3.9.8",      # MARIA MADALENA GRISSI
        "1.1.3.10",       # LAURITA GRISSI
        "1.1.3.6.1.1",    # RITA DE CÁSSIA GRIS PETINELLI
        "1.1.3.6.1.2",    # LUIZ CARLOS GRIS PETINELLI
        "1.1.3.6.1.3",    # MARCO TULIO GRIS PETINELLI
        "1.1.3.6.1.4",    # PAULO CESAR GRIS PETINELLI
        "1.1.3.6.2.1",    # CLAUDIO MARCIO BALSA GRIS
        "1.1.3.6.2.2",    # ANA PAULA BALSA GRIS
        "1.1.3.6.2.3",    # ANA CRISTINA BALSA GRIS
        "1.1.3.6.2.2.1",  # WALLACE GRIS
        "1.1.3.6.2.2.2",  # PAULO CESAR BALSA LEMOS DA SILVA
        "1.1.3.6.2.2.3",  # YASMIN GRIS LEMOS DA SILVA
        "1.1.3.6.2.1.1",  # TACIANE BALSA GRIS
        "1.1.3.6.3.1",    # ROBERTA GRIS DE SOUZA
        "1.1.3.6.3.2",    # RODRIGO GRIS DE SOUZA
        "1.1.3.6.4.1",    # VIRGINIA GRIS CEOLIN
        "1.1.3.6.4.2",    # EDUARDO GRIS CEOLIN
        "1.1.3.6.4.3",    # MARCELO GRIS CEOLIN
        "1.1.3.6.6.1",    # ALESSANDRO GRIS DRUMOND
        "1.1.3.6.6.2",    # ISABELA GRIS DRUMOND
        "1.1.3.6.6.3",    # PAULA GRIS DRUMOND LOBATO
        "1.1.3.6.6.1.1",  # JULIA VASCONCELLOS DRUMOND
        "1.1.3.6.6.1.2",  # RICARDO VASCONCELLOS DRUMOND
        "1.1.3.6.6.2.1",  # BRUNO DRUMOND COELHO
        "1.1.3.6.6.2.2",  # BERNARDO DRUMOND COELHO
        "1.1.3.6.6.3.1",  # JOAQUIM DRUMOND LOBATO
        "1.1.3.7.1",      # LAURITA CANTON
        "1.1.3.7.2",      # MARIA ADÉZIA CANTON
        "1.1.3.7.4",      # ZULMIRA HELENA CANTON
        "1.1.3.7.5",      # MARLI CANTON
        "1.1.3.7.6",      # GERALDO CANTON
        "1.1.3.7.7",      # JOSÉ CANTON
        "1.1.3.7.2.1",    # MÁRCIA MARIZE DE CASTRO
        "1.1.3.7.2.2",    # MARIA DAS GRAÇAS DE CASTRO
        "1.1.3.7.2.3",    # MARLY DE CASTRO
        "1.1.3.7.2.4",    # MÁRCIO ANTÔNIO DE CASTRO
        "1.1.3.7.3.1",    # JULIANA CANTON DE LAZZARI
        "1.1.3.7.3.1.1",  # LETICIA CANTON DE LAZZARI VIEIRA
        "1.1.3.7.3.2",    # FABIANO CANTON DE LAZZARI
        "1.1.3.7.4.1",    # LUIZ CARLOS ROCHA JÚNIOR
        "1.1.3.7.4.1.1",  # AMANDA ABURACHID ROCHA
        "1.1.3.7.4.1.2",  # BÁRBARA ABURACHID ROCHA
        "1.1.3.7.4.1.3",  # CLARISSA ABURACHID ROCHA
        "1.1.3.7.4.2",    # JUNIA CANTON ROCHA
        "1.1.3.7.4.2.1",  # IGOR CANTON ROCHA MOREIRA
        "1.1.3.7.4.2.2",  # DANIEL CANTON ALVIM MOREIRA
        "1.1.3.7.4.3",    # ADRIANO CANTON ROCHA
        "1.1.3.7.5.1",    # ÉLIDA CANTON CASTANHEIRA
        "1.1.3.7.6.1",    # LIGIA SANTOS CANTON
        "1.1.3.7.7.1",    # RAFAEL SANTOS CANTON
        "1.1.3.7.7.2",    # TIAGO SANTOS CANTON
        "1.1.3.8.1.1",    # JAQUELINE GRISSI CARDOSO
        "1.1.3.8.1.1.1",  # MARIANA CARDOSO DELGADO
        "1.1.3.8.1.1.2",  # BÁRBARA CARDOSO DELGADO
        "1.1.3.8.1.1.2.1", # DIEGO GRISSI LAGARES
        "1.1.3.8.1.1.2.2", # NOAH GRISSI LAGARES
        "1.1.3.8.1.1.2.3", # JULIA GRISSI LAGARES
        "1.1.3.8.1.1.3",  # GUILHERME CARDOSO DELGADO
        "1.1.3.8.1.1.3.1", # LUIGI GRISSI ALVES DELGADO
        "1.1.3.8.1.2",    # CARINA GRISSI CARDOSO
        "1.1.3.8.1.2.1",  # BERNARDO GRISSI CARDOSO MAIA
        "1.1.3.8.1.2.1.1", # MARIA EDUARDA SILVA GRISSI MAIA
        "1.1.3.8.1.2.2",  # CRISTIANO CARDOSO MAIA
        "1.1.3.8.1.3",    # RODRIGO GRISSI CARDOSO
        "1.1.3.8.1.3.1",  # GABRIELLA NÓBREGA GRISSI CARDOSO
        "1.1.3.8.1.3.2",  # SANTIAGO RIBEIRO GRISSI CARDOSO
        "1.1.3.8.2.1",    # JULIANA GRISSI CARDOSO
        "1.1.3.8.2.1.1",  # GABRIELA GRISSI CARDOSO BRAGA
        "1.1.3.8.2.2",    # RENATA GRISSI CARDOSO
        "1.1.3.8.2.2.1",  # THIAGO GRISSI CARDOSO SOEIRO DE CARVALHO
        "1.1.3.8.2.2.2",  # HENRIQUE GRISSI CARDOSO SOEIRO DE CARVALHO
        "1.1.3.8.2.3",    # CAROLINA GRISSI CARDOSO
        "1.1.3.8.2.3.1",  # MANUELA GRISSI CARDOSO CECILIO TIMÓTEO
        "1.1.3.8.2.3.2",  # LEONARDO GRISSI CARDOSO CECÍLIO TIMÓTEO
        "1.1.3.8.3.1",    # ANA MARIA GRISSI MABILLOT
        "1.1.3.8.3.2",    # ADRIANA GRISSI MABILLOT
        "1.1.3.8.3.3",    # ALEXANDRE GRISSI MABILLOT
        "1.1.3.8.3.3.1",  # AMANDA CARVALHO MABILLOT
        "1.1.3.8.3.3.1.1", # BEATRIZ MABILLOT TINOCO
        "1.1.3.8.3.3.2",  # ISABELLA CARVALHO MABILLOT
        "1.1.3.8.3.4",    # RICARDO GRISSI MABILLOT
        "1.1.3.8.3.5",    # FLÁVIA GRISSI MABILLOT
        "1.1.3.8.6.1",    # GUSTAVO CARDOSO GRISSI
        "1.1.3.8.6.1.1",  # CECILIA RODRIGUES CARDOSO GRISSI
        "1.1.3.8.8.1",    # CAMILA GRISSI PIMENTA
        "1.1.3.8.8.1.1",  # SOFIA GRISSI DE CARVALHO
        "1.1.3.8.8.1.2",  # PEDRO GRISSI DE CARVALHO
        "1.1.3.8.8.1.3",  # LUCAS GRISSI DE CARVALHO
        "1.1.3.8.8.2",    # VINICIUS GRISSI PIMENTA
        "1.1.3.9.1.1",    # AMARILDO CANDIAN
        "1.1.3.9.1.1.1",  # DANIEL CANDIAN
        "1.1.3.9.1.1.2",  # NILSON CANDIAN NETO
        "1.1.3.9.1.2",    # ZURAIDE CANDIAN
        "1.1.3.9.1.2.1",  # KAROLINE DRUMOND
        "1.1.3.9.1.2.2",  # RAFAELA DRUMOND
        "1.1.3.9.1.3",    # EVERALDO CANDIAN
        "1.1.3.9.1.3.1",  # IGÔR LUCAS CANDIAN
        "1.1.3.9.1.3.2",  # MATEUS FELIPE CANDIAN
        "1.1.3.9.2.1",    # PAULO RICARDO GRISSI
        "1.1.3.9.2.1.1",  # ANA LUIZA MACIEL GRISSI
        "1.1.3.9.2.2",    # CLÁUDIA GRISSI
        "1.1.3.9.2.3",    # FLAVIA GRISSI
        "1.1.3.9.2.4",    # LEONARDO DIAS GRISSI
        "1.1.3.9.2.5",    # CESAR AUGUSTO DIAS GRISSI
        "1.1.3.9.3.1",    # ALESSANDRA GRISSI GUERRA
        "1.1.3.9.3.2",    # DIARLHES GRISSI GUERRA
        "1.1.3.9.4.1.1",  # BEATRIZ
        "1.1.3.9.4.2",    # JEAN CARLO ZONZIN
        "1.1.3.9.5.1",    # ANDREA BERGAMINI
        "1.1.3.9.5.1.1",  # JULIANA BERGAMINI REIS
        "1.1.3.9.5.2",    # JOÃO RICARDO BERGAMINI
        "1.1.3.9.5.3",    # VALÉRIA BERGAMINI
        "1.1.3.9.6.1",    # EULER MARCOS ZONZIN
        "1.1.3.9.6.2",    # PATRICIA ELIANE ZONZIN
        "1.1.3.9.6.2.1",  # ERIK ZONZIN ESTEVES
        "1.1.3.9.6.2.2",  # RODRIGO ZONZIN ESTEVES
        "1.1.3.9.6.2.3",  # IZADORA ZONZIN ESTEVES
        "1.1.3.9.6.3",    # WESLEY JOSÉ ZONZIN
        "1.1.3.9.7.1",    # FERNANDA MÁRCIA GRISSI
        "1.1.3.9.7.2",    # PAULO SÉRGIO GRISSI
        "1.1.3.9.7.2.1",  # RAFAEL LUCAS GRISSI
        "1.1.3.9.7.3",    # DENISE ANGÉLICA GRISSI
        "1.1.3.9.8.1",    # RODRIGO GRISSI CANDIAN
        "1.1.3.9.8.1.1",  # PAOLA BÁRBARA GRISSI CANDIAN
        "1.1.3.10.1",     # LINO BERTOLIN
        "1.1.3.10.2",     # MAURICIO BERTOLIN
        "1.1.3.10.3",     # MARIA HELENA BERTOLIN
        "1.1.3.10.4",     # MARIA LÚCIA BERTOLIN
        "1.1.3.10.1.1",   # RONALDO BERTOLIN
        "1.1.3.10.1.2",   # RENATA BERTOLIN
        "1.1.3.10.1.3",   # RITA DE CÁSSIA BERTOLIN
        "1.1.3.10.1.4",   # LEONARDO BERTOLIN
        "1.1.3.10.2.1",   # FERNANDA DE FÁTIMA BERTOLIN
        "1.1.3.10.2.2",   # FABIANA BERTOLIN
        "1.1.3.10.2.3",   # FLÁVIA BERTOLIN
        "1.1.3.10.4",     # MARIA LÚCIA BERTOLIN
    ]
    
    print("Extracting remaining missing person data...")
    
    for person_id in remaining_missing_ids:
        print(f"Processing {person_id}...")
        person_info = extract_person_info(html_content, person_id)
        
        if person_info:
            print(f"  Found: {person_info['name']}")
            json_data = add_missing_person_to_json(json_data, person_id, person_info)
        else:
            print(f"  Not found in HTML")
    
    # Save updated JSON
    save_json_data(json_data, 'family-data-final.json')
    print(f"\nUpdated JSON saved to family-data-final.json")
    print(f"Total family members: {len(json_data['familyMembers'])}")

if __name__ == "__main__":
    main()
