import os, glob

base_dir = os.path.dirname(os.path.abspath(__file__))
routes_pattern = os.path.join(base_dir, 'app', 'routes', '*.py')
for filepath in glob.glob(routes_pattern):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changed = False
    needs_auth_import = []
    
    # Check if from app.auth exists
    auth_lines = [line for line in content.split('\n') if line.startswith('from app.auth import')]
    
    if 'get_current_user' in content:
        if not auth_lines or 'get_current_user' not in auth_lines[0]:
            needs_auth_import.append('get_current_user')
            
    if 'get_current_manager' in content:
        if not auth_lines or 'get_current_manager' not in auth_lines[0]:
            needs_auth_import.append('get_current_manager')
        
    if needs_auth_import:
        if auth_lines:
            auth_line = auth_lines[0]
            new_auth_line = auth_line + ', ' + ', '.join(needs_auth_import)
            content = content.replace(auth_line, new_auth_line)
        else:
            # Add to imports
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if line.startswith('from app.'):
                    lines.insert(i, 'from app.auth import ' + ', '.join(needs_auth_import))
                    break
            content = '\n'.join(lines)
        changed = True

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed ' + filepath)
