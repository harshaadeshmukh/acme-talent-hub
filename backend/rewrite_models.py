import re

with open('app/models/models.py', 'r') as f:
    code = f.read()

# 1. Imports
code = code.replace('from app.database import Base', 'from app.database import Base1, Base2')

# 2. Remove Company
code = re.sub(r'class Company\(Base\):.*?created_at = Column\(DateTime, default=datetime\.utcnow\)\n', '', code, flags=re.DOTALL)

# 3. Change Bases
for cls in ['User', 'Department', 'Competency', 'EmployeeCompetency']:
    code = re.sub(fr'class {cls}\(Base\):', f'class {cls}(Base1):', code)

for cls in ['WorkTimelineEvent', 'PerformanceReview', 'TrainingRecord', 'Goal', 'TeamAchievement', 'ChatMessage']:
    code = re.sub(fr'class {cls}\(Base\):', f'class {cls}(Base2):', code)

# 4. Remove tenant_id
code = re.sub(r'\s+tenant_id = Column\(Integer, index=True, nullable=False\)\n', '\n', code)

# 5. Remove Cross-DB Foreign Keys
code = code.replace('employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)', 'employee_id = Column(Integer, index=True, nullable=False)')
code = code.replace('reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)', 'reviewer_id = Column(Integer, index=True, nullable=False)')
code = code.replace('verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)', 'verified_by_id = Column(Integer, index=True, nullable=True)')

# 6. Remove cross-db relationships in User
user_rels_to_remove = [
    r'\s+reviews_given = relationship\([^)]+\)\n',
    r'\s+reviews_received = relationship\([^)]+\)\n',
    r'\s+training_records = relationship\([^)]+\)\n',
    r'\s+goals = relationship\([^)]+\)\n',
    r'\s+timeline_events = relationship\([^)]+\)\n'
]
for rel in user_rels_to_remove:
    code = re.sub(rel, '\n', code)

# 7. Remove cross-db relationships in other models
rels_to_remove = [
    r'\s+employee = relationship\("User".*?\)\n',
    r'\s+reviewer = relationship\("User".*?\)\n',
    r'\s+verified_by = relationship\("User".*?\)\n'
]
for rel in rels_to_remove:
    code = re.sub(rel, '\n', code)

# 8. Properties employee_name
code = re.sub(r'\s+@property\n\s+def employee_name\(self\):\n\s+return self\.employee\.name if self\.employee else None\n', '\n', code)

with open('app/models/models.py', 'w') as f:
    f.write(code)

print('Models rewritten successfully')
