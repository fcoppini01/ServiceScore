import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    with zipfile.ZipFile(docx_path, 'r') as docx:
        xml_content = docx.read('word/document.xml')
    
    namespace = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    root = ET.fromstring(xml_content)
    
    paragraphs = []
    for para in root.iter(namespace + 'p'):
        texts = []
        for text in para.iter(namespace + 't'):
            if text.text:
                texts.append(text.text)
        if texts:
            paragraphs.append(''.join(texts))
    
    return '\n'.join(paragraphs)

if __name__ == '__main__':
    docx_file = sys.argv[1]
    text = extract_text_from_docx(docx_file)
    output_file = sys.argv[2] if len(sys.argv) > 2 else docx_file + '.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Extracted to {output_file}")
