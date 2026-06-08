import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import './EnterpriseSection.css';
import './TalentIntelligence.css';
import ErrorBoundary from './ErrorBoundary';

const LEVEL_MAP = { beginner: 1, intermediate: 2, advanced: 3, expert: 4, master: 5 };
const INVERSE_LEVEL_MAP = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert', 5: 'Master' };

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#0ea5e9', '#ef4444', '#14b8a6'];

function Avatar({ name, size = 36, index = 0, imageUrl }) {
  const [imgError, setImgError] = useState(false);
  if (imageUrl && !imgError) {
    return <img src={imageUrl} alt={name} className="es-avatar" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onError={() => setImgError(true)} />;
  }
  const bg = COLORS[(index || 0) % COLORS.length];
  return (
    <div className="es-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.38, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#fff' }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

// Custom Tooltip for Radar Chart (Light Theme)
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', color: '#0f172a', fontSize: '14px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: '800', marginBottom: '12px', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>{payload[0].payload.name}</div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '16px', fontWeight: 600 }}>
            <span>{entry.name}:</span>
            <strong>{INVERSE_LEVEL_MAP[entry.value] || 'None'} ({entry.value})</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Modal Wrapper (Matched from LearningSection) ─────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="es-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="es-modal" style={{ maxWidth: '580px' }}>
        <div className="es-modal-header">
          <div>
            <h2 className="es-modal-title">{title}</h2>
            {subtitle && <p className="es-modal-sub">{subtitle}</p>}
          </div>
          <button className="es-modal-close" onClick={onClose}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="es-modal-body">{children}</div>
      </div>
    </div>
  )
}

function PremiumDropdown({ options, value, onChange, onRemove, showRemove, color }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery(''); // reset search on close
      }
    };document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id.toString() === value?.toString());

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '210px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
           padding: '8px 12px 8px 14px', background: '#fff', 
           border: `1px solid ${isOpen ? color : '#e2e8f0'}`,
           borderLeft: `4px solid ${color}`, borderRadius: '10px', cursor: 'pointer',
           boxShadow: isOpen ? `0 0 0 3px ${color}20` : '0 2px 4px rgba(0,0,0,0.02)',
           transition: 'all 0.2s ease', color: '#0f172a', fontWeight: 600, fontSize: '13px'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption.name : 'Select Employee...'}
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showRemove && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{ background: 'rgba(241,245,249,0.8)', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(241,245,249,0.8)'; e.currentTarget.style.color = '#64748b'; }}
              title="Remove Employee"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '280px', width: 'max-content',
          background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0', zIndex: 50, padding: '8px',
          animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ padding: '0 4px 8px 4px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
            <input 
              type="text"
              placeholder="Search by name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none',
                background: '#f8fafc', color: '#334155'
              }}
              autoFocus
            />
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
            {options.filter(opt => 
              opt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (opt.job_title && opt.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (opt.department && opt.department.toLowerCase().includes(searchQuery.toLowerCase()))
            ).length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No matches found</div>
            ) : (
              options.filter(opt => 
                opt.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (opt.job_title && opt.job_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (opt.department && opt.department.toLowerCase().includes(searchQuery.toLowerCase()))
              ).map(opt => {
                const isSelected = opt.id.toString() === value?.toString();
                return (
                  <div 
                    key={opt.id}
                    onClick={() => { onChange(opt.id.toString()); setIsOpen(false); setSearchQuery(''); }}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? `${color}15` : 'transparent',
                      color: isSelected ? color : '#334155',
                      fontWeight: isSelected ? 700 : 500,
                      fontSize: '13px', transition: 'background 0.15s',
                      display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSelected ? color : 'transparent' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ whiteSpace: 'nowrap' }}>{opt.name}</span>
                          {(opt.job_title || opt.role) && <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{opt.job_title || opt.role}</span>}
                        </div>
                      </div>
                      {(() => {
                        const isAssigned = opt.department && opt.department.toLowerCase() !== 'unassigned';
                        return (
                          <span style={{ 
                            fontSize: '10px', 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            background: isAssigned ? '#eef2ff' : '#f8fafc', 
                            color: isAssigned ? '#4f46e5' : '#94a3b8',
                            border: `1px solid ${isAssigned ? '#e0e7ff' : '#e2e8f0'}`
                          }}>
                            {isAssigned ? opt.department : 'Unassigned'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TalentIntelligenceSection() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overlay'); // overlay, matrix, matching
  
  const headers = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('acme_token')}`,
    'Content-Type': 'application/json'
  }), []);

  // --- TAB 1: Employee Comparison State ---
  const [employees, setEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // --- TAB 2: Team Matrix State ---
  const [matrixData, setMatrixData] = useState(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Fetch employees for dropdown
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/users', { headers: headers() })
      .then(res => res.json())
      .then(data => {
        let team = data.filter(u => u.role === 'employee');
        if (user?.role !== 'admin' && user?.department) {
          team = team.filter(u => 
            u.department === user.department || 
            !u.department || 
            u.department.toLowerCase() === 'unassigned'
          );
        }
        setEmployees(team);
        if (team.length > 0) {
          setSelectedEmpIds([team[0].id.toString(), team.length > 1 ? team[1].id.toString() : team[0].id.toString()]);
        }
      })
      .catch(err => console.error(err));
  }, [user, headers]);

  // Fetch Comparison Data — also clears stale data before fetching
  useEffect(() => {
    if (activeTab !== 'overlay' || selectedEmpIds.length === 0 || employees.length === 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComparisonData(null);
    setLoadingComparison(true);

    const validIds = selectedEmpIds.filter(id => employees.some(e => e.id.toString() === id));
    if (validIds.length === 0) { setLoadingComparison(false); return; }

    let cancelled = false;

    Promise.all(
      validIds.map(id =>
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/competencies/employee/${id}`, { headers: headers() }).then(res => res.json())
      )
    )
      .then((responses) => {
        if (cancelled) return;
        const emps = validIds.map(id => employees.find(e => e.id.toString() === id)).filter(Boolean);
        if (emps.length === 0) return;

        const allComps = new Map();
        const n = emps.length;

        responses.forEach((empSkills, index) => {
          if (!Array.isArray(empSkills)) return;
          empSkills.forEach(ec => {
            if (!ec.competency) return; // Safely skip if API returned null competency
            if (!allComps.has(ec.competency.id)) {
              const base = { id: ec.competency.id, name: ec.competency.name };
              for (let i = 0; i < n; i++) base[`emp_${i}_val`] = 0;
              allComps.set(ec.competency.id, base);
            }
            allComps.get(ec.competency.id)[`emp_${index}_val`] = LEVEL_MAP[ec.skill_level] || 1;
          });
        });

        setComparisonData({ emps, skills: Array.from(allComps.values()) });
      })
      .catch(err => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setLoadingComparison(false); });

    return () => { cancelled = true; };
  }, [activeTab, selectedEmpIds, employees, headers]);

  // Fetch Matrix Data
  useEffect(() => {
    if (activeTab === 'matrix') {
      const fetchMatrix = () => {
        fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/talent-intelligence/team-matrix', { headers: headers() })
          .then(res => res.json())
          .then(data => setMatrixData(data))
          .catch(err => console.error(err))
          .finally(() => setLoadingMatrix(false));
      };
      if (!matrixData) setTimeout(() => setLoadingMatrix(true), 0);
      setTimeout(() => fetchMatrix(), 0);
      
      const handleUpdate = () => fetchMatrix();
    window.addEventListener('app-update', handleUpdate);
    return () => window.removeEventListener('app-update', handleUpdate);
    }
  }, [activeTab, headers, matrixData]);



  const renderTabs = () => (
    <div className="ti-tabs-wrapper">
      <button className={`ti-tab ${activeTab === 'overlay' ? 'active' : ''}`} onClick={() => setActiveTab('overlay')}>
        🤝 Employee Comparison
      </button>
      <button className={`ti-tab ${activeTab === 'matrix' ? 'active' : ''}`} onClick={() => setActiveTab('matrix')}>
        📊 Team Skill Matrix
      </button>
    </div>
  );

  const renderOverlayTab = () => {
    try {
      let topSkillCounts = [];
      let tieCount = 0;
      
      if (comparisonData?.skills && comparisonData?.emps) {
        topSkillCounts = comparisonData.emps.map(() => 0);
        comparisonData.skills.forEach(skill => {
              let maxVal = -1;
              let topEmps = [];
              comparisonData.emps.forEach((emp, index) => {
                const val = skill[`emp_${index}_val`];
                if (val > maxVal) { maxVal = val; topEmps = [index]; }
                else if (val === maxVal && val > 0) { topEmps.push(index); }
              });
              if (topEmps.length === 1 && maxVal > 0) topSkillCounts[topEmps[0]]++;
              else if (topEmps.length > 1 && maxVal > 0) tieCount++;
        });
      }

      return (
        <div className="ti-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 250px' }}>
            <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Skill Comparison</h3>
            <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '1rem' }}>Overlay employees to find complementary skillsets.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start', flex: '1 1 250px' }}>
            {selectedEmpIds.map((id, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <PremiumDropdown 
                    value={id}
                    options={employees}
                    color={COLORS[index % COLORS.length]}
                    showRemove={selectedEmpIds.length > 1}
                    onChange={(newVal) => {
                      const newIds = [...selectedEmpIds];
                      newIds[index] = newVal;
                      setSelectedEmpIds(newIds);
                    }}
                    onRemove={() => setSelectedEmpIds(selectedEmpIds.filter((_, i) => i !== index))}
                  />
                </div>
            ))}
            {selectedEmpIds.length < 4 && (
              selectedEmpIds.length < employees.length ? (
                <button 
                  onClick={() => {
                    const nextEmp = employees.find(e => !selectedEmpIds.includes(e.id.toString()));
                    if (nextEmp) setSelectedEmpIds([...selectedEmpIds, nextEmp.id.toString()]);
                  }} 
                  className="ti-add-emp-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Add Employee
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: '#94a3b8', padding: '6px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  No more employees to add
                </span>
              )
            )}
          </div>
        </div>

        {new Set(selectedEmpIds).size !== selectedEmpIds.length && (
          <div style={{ margin: '16px 0 0 0', padding: '12px 16px', background: '#fffbeb', color: '#b45309', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600, boxShadow: '0 2px 8px rgba(253, 230, 138, 0.4)' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Please pick a different employee for comparison. You have selected the same employee more than once!
          </div>
        )}

        {loadingComparison && !comparisonData ? (
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading comparison...</div>
        ) : comparisonData?.skills?.length > 0 ? (
          <div className="ti-comparison-layout">
            <div className="ti-radar-container">
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                {comparisonData.emps.map((emp, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Avatar name={emp.name || 'Unknown'} size={40} imageUrl={emp.profile_pic_url} index={index} />
                    <div>
                      <h4 style={{ margin: '0 0 2px 0', color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>{emp.name || 'Unknown'}</h4>
                      <div style={{ fontSize: '0.8rem', color: COLORS[index % COLORS.length], fontWeight: '700' }}>{emp.job_title || 'Employee'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="ti-chart-wrapper" style={{ position: 'relative' }}>
                {/* Subtle background glow effect behind the entire chart */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[...comparisonData.skills].sort((a, b) => Math.max(...comparisonData.emps.map((_, i) => b[`emp_${i}_val`])) - Math.max(...comparisonData.emps.map((_, i) => a[`emp_${i}_val`]))).slice(0, 12)}>
                    <defs>
                      {comparisonData.emps.map((emp, index) => (
                        <linearGradient key={`grad-${index}`} id={`radarFill-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6}/>
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.05}/>
                        </linearGradient>
                      ))}
                      <filter id="radarShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.15" />
                      </filter>
                    </defs>
                    
                    <PolarGrid gridType="circle" radialLines={true} stroke="#cbd5e1" strokeDasharray="4 4" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#334155', fontSize: 13, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} tickCount={6} />
                    
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    
                    {comparisonData.emps.map((emp, index) => (
                      <Radar 
                        key={index}
                        name={emp.name || 'Unknown'} 
                        dataKey={`emp_${index}_val`} 
                        stroke={COLORS[index % COLORS.length]} 
                        strokeWidth={3}
                        fill={`url(#radarFill-${index})`}
                        fillOpacity={1} 
                        style={{ filter: 'url(#radarShadow)' }}
                        activeDot={{ r: 6, fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2, filter: 'url(#radarShadow)' }}
                        dot={{ r: 4, fill: '#fff', stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                      />
                    ))}
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="ti-premium-card" style={{ alignSelf: 'start' }}>
              <h4 style={{ marginTop: 0, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', fontSize: '1.2rem', fontWeight: 800 }}>
                Comparison Summary
              </h4>
              
              <div className="ti-metric-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
                {comparisonData.emps.map((emp, index) => (
                  <div key={index} className="ti-metric-box">
                    <div className="ti-metric-value" style={{ color: COLORS[index % COLORS.length], fontSize: '1.5rem' }}>{topSkillCounts[index]}</div>
                    <div className="ti-metric-label">{(emp.name || 'Unknown').split(' ')[0]} leads</div>
                  </div>
                ))}
                {tieCount > 0 && (
                  <div className="ti-metric-box" style={{ background: '#f8fafc' }}>
                    <div className="ti-metric-value" style={{ color: '#64748b', fontSize: '1.5rem' }}>{tieCount}</div>
                    <div className="ti-metric-label">Tied Skills</div>
                  </div>
                )}
              </div>

              <h5 style={{ color: '#475569', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                Skill Leaders {comparisonData.skills.length > 12 && <span style={{fontSize: '12px', fontWeight: 500, color: '#94a3b8', marginLeft: '8px'}}>(Top skills shown in chart)</span>}
              </h5>
              <div className="ti-gap-panel" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
                {comparisonData.skills.sort((a, b) => {
                   const maxA = Math.max(...comparisonData.emps.map((_, i) => a[`emp_${i}_val`]));
                   const maxB = Math.max(...comparisonData.emps.map((_, i) => b[`emp_${i}_val`]));
                   return maxB - maxA;
                }).map(skill => {
                  let maxVal = 0;
                  let topEmps = [];
                  comparisonData.emps.forEach((emp, index) => {
                    const val = skill[`emp_${index}_val`];
                    if (val > maxVal) { maxVal = val; topEmps = [index]; }
                    else if (val === maxVal && val > 0) { topEmps.push(index); }
                  });
                  
                  if (maxVal === 0) return null; // No one has this skill

                  const isTie = topEmps.length > 1;
                  const leaderIndex = topEmps[0];
                  const leaderName = isTie ? 'Tie' : (comparisonData.emps[leaderIndex].name || 'Unknown').split(' ')[0];
                  const leaderColor = isTie ? '#64748b' : COLORS[leaderIndex % COLORS.length];

                  return (
                    <div key={skill.id} className="ti-gap-item" style={{ borderLeft: `4px solid ${leaderColor}`}}>
                      <span className="ti-gap-skill">{skill.name}</span>
                      <span className="ti-gap-badge" style={{
                        background: isTie ? '#f1f5f9' : `${leaderColor}15`,
                        color: leaderColor
                      }}>{leaderName} (Lvl {maxVal})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.4rem', color: '#0f172a', fontWeight: 800 }}>No Shared Skill Data Available</h3>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>The selected employees do not have recorded competencies yet.</p>
          </div>
        )}
      </div>
    );
    } catch (error) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', borderRadius: '12px', color: '#991b1b', fontFamily: 'monospace' }}>
          <h2>💥 Function Crashed!</h2>
          <p style={{ fontWeight: 'bold' }}>{error.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px' }}>
            <summary>Click to view stack trace</summary>
            {error.stack}
          </details>
          <p>Please copy this error and send it!</p>
        </div>
      );
    }
  };

  const renderMatrixTab = () => {
    if (loadingMatrix || !matrixData) return <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 600 }}>Loading matrix...</div>;

    const { competencies, matrix, summaries } = matrixData;
    
    let weakestSkill = null;
    let strongestSkill = null;
    
    if (competencies.length > 0) {
      const sortedByAvg = [...competencies].sort((a, b) => summaries[b.id].avg - summaries[a.id].avg);
      strongestSkill = sortedByAvg[0];
      weakestSkill = sortedByAvg[sortedByAvg.length - 1];
    }

    const levelLabels = ['–', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
    const levelColors = ['#f1f5f9', '#fef3c7', '#dbeafe', '#dcfce7', '#d1fae5', '#f3e8ff'];
    const levelTextColors = ['#94a3b8', '#92400e', '#1e40af', '#166534', '#065f46', '#6b21a8'];

    return (
      <div className="ti-container">
        {competencies.length > 0 && (
          <div className="ti-summary-bar">
            <div className="ti-summary-icon">🔥</div>
            <div className="ti-summary-content">
              <h3>Team Capability Overview</h3>
              <p>
                Your team shows highest proficiency in <span style={{ color: '#059669', fontWeight: 700 }}>{summaries[strongestSkill.id].name}</span> 
                ({summaries[strongestSkill.id].experts} experts), but has a critical gap in 
                <span style={{ color: '#dc2626', fontWeight: 700 }}> {summaries[weakestSkill.id].name}</span> 
                (avg level {summaries[weakestSkill.id].avg.toFixed(1)}).
              </p>
            </div>
          </div>
        )}

        <div className="ti-cards-grid">
          {matrix.map((row, idx) => {
            const COLLAPSED_LIMIT = 6;
            // Only show skills the person actually has (val > 0)
            const skillsWithVal = competencies.filter(c => row.skills[c.id]?.val > 0);
            const skillsWithout = competencies.filter(c => !row.skills[c.id]?.val);
            const isExpanded = expandedCards.has(row.employee_id);
            const visibleSkills = isExpanded
              ? competencies  // show all including no-skill ones when expanded
              : skillsWithVal.slice(0, COLLAPSED_LIMIT);
            const hiddenCount = skillsWithVal.length - COLLAPSED_LIMIT;

            return (
            <div key={row.employee_id} className="ti-member-card">
              <div className="ti-member-card-header">
                <Avatar name={row.employee_name} imageUrl={row.avatar_url} index={idx} size={48} />
                <div className="ti-member-card-info">
                  <div className="ti-member-card-name">{row.employee_name}</div>
                  <div className="ti-member-card-role">{row.role}</div>
                </div>
                <div className="ti-skill-count-badge">{skillsWithVal.length} skill{skillsWithVal.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="ti-member-skills">
                {visibleSkills.map(c => {
                  const skill = row.skills[c.id];
                  const val = skill ? skill.val : 0;
                  const levelLabels = ['–', 'Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
                  const levelColors = ['#f1f5f9', '#fef3c7', '#dbeafe', '#dcfce7', '#d1fae5', '#f3e8ff'];
                  const levelTextColors = ['#94a3b8', '#92400e', '#1e40af', '#166534', '#065f46', '#6b21a8'];
                  return (
                    <div key={c.id} className="ti-skill-chip" style={{
                      background: levelColors[val],
                      color: levelTextColors[val],
                    }}>
                      <span className="ti-skill-chip-name">{c.name}</span>
                      <span className="ti-skill-chip-level">{val > 0 ? levelLabels[val] : '–'}</span>
                    </div>
                  );
                })}
                {!isExpanded && hiddenCount > 0 && (
                  <button className="ti-show-more-btn" onClick={() => toggleCard(row.employee_id)}>
                    +{hiddenCount} more
                  </button>
                )}
                {!isExpanded && skillsWithVal.length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>No skills recorded yet</span>
                )}
              </div>
              {(isExpanded || (!isExpanded && skillsWithVal.length > COLLAPSED_LIMIT)) && (
                <button
                  className="ti-toggle-btn"
                  onClick={() => toggleCard(row.employee_id)}
                >
                  {isExpanded ? '▲ Show less' : `▼ Show all ${competencies.length} skills`}
                </button>
              )}
            </div>
            );
          })}
        </div>

        {competencies.length > 0 && (
          <div className="ti-averages-bar">
            <div className="ti-averages-title">📊 Team Averages</div>
            <div className="ti-averages-chips">
              {competencies.map(c => (
                <div key={c.id} className="ti-avg-chip">
                  <span className="ti-avg-skill">{c.name}</span>
                  <span className="ti-avg-val">{summaries[c.id].avg.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ti-legend">
          <div className="ti-legend-item"><div className="ti-legend-color heat-1"></div> Beginner (1)</div>
          <div className="ti-legend-item"><div className="ti-legend-color heat-2"></div> Intermediate (2)</div>
          <div className="ti-legend-item"><div className="ti-legend-color heat-3"></div> Advanced (3)</div>
          <div className="ti-legend-item"><div className="ti-legend-color heat-4"></div> Expert (4)</div>
          <div className="ti-legend-item"><div className="ti-legend-color heat-5"></div> Master (5)</div>
        </div>
      </div>
    );
  };


  return (
    <div className="es-section-content" style={{ animation: 'fadeIn 0.4s ease', paddingTop: '20px' }}>
      {(!user?.department || user?.department === 'Unassigned') ? (
        <div className="es-panel" style={{ padding: '60px 20px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>You are not assigned to a team</h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '400px', margin: '0 auto 24px', lineHeight: '1.5' }}>
            Please select or add a team from your profile to start viewing talent intelligence insights.
          </p>
        </div>
      ) : (
        <>
      {/* Hero Header matching LearningSection style */}
      <div style={{
        backgroundColor: '#0f1117',
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        borderRadius: '16px', padding: '18px 22px',
        marginBottom: '18px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.04em' }}>
              ⬡ Manager Dashboard / <span style={{ color: 'rgba(255,255,255,0.6)' }}>Analytics Hub</span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', margin: '0', letterSpacing: '-0.02em' }}>
              Talent Intelligence
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0' }}>
              Data-driven insights to optimize your workforce capability and project staffing.
            </p>
          </div>
        </div>
      </div>
          <div style={{ marginBottom: '10px' }}>
            {renderTabs()}
          </div>

          <ErrorBoundary>
            <div className="es-section-content" style={{ marginTop: '0' }}>
              {activeTab === 'overlay' && renderOverlayTab()}
              {activeTab === 'matrix' && renderMatrixTab()}
            </div>
          </ErrorBoundary>
        </>
      )}
    </div>
  );
}
