import os

def fix_files(directory):
    old_str = r"\${import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_URL || 'http://localhost:8000') + ''}"
    new_str = r"${import.meta.env.VITE_API_URL || 'http://localhost:8000'}"
    
    for root, dirs, files in os.walk(directory):
        if "node_modules" in root:
            continue
        for file in files:
            if file.endswith(".jsx") or file.endswith(".js"):
                path = os.path.join(root, file)
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                if old_str in content:
                    content = content.replace(old_str, new_str)
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(content)
                    print(f"Fixed: {path}")

fix_files("frontend/src")
