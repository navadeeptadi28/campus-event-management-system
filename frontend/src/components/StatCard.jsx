export default function StatCard({label,value,icon}){return <div className="stat-card"><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span></div></div>}
