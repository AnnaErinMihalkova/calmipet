import os

files_to_check = [
    r'c:\Users\Anna\calmipet\backend\backend\urls.py',
    r'c:\Users\Anna\calmipet\backend\api\views.py'
]

for file_path in files_to_check:
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            if b'\x00' in content:
                print(f"FOUND NULL BYTE in {file_path}")
                # Find position
                pos = content.find(b'\x00')
                print(f"  At position: {pos}")
                print(f"  Surrounding bytes: {content[max(0, pos-10):pos+10]}")
            else:
                print(f"No null bytes in {file_path}")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
