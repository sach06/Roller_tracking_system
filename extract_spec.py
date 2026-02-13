import docx
import sys

def extract_text(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_spec.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    text = extract_text(file_path)
    print(text)
