'use client';

interface Recommendation {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  actionItems: string[];
  category: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export default function RecommendationsList({ recommendations }: RecommendationsListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-50 border-red-500 text-red-800';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-500 text-yellow-800';
      case 'LOW': return 'bg-green-50 border-green-500 text-green-800';
      default: return 'bg-gray-50 border-gray-500 text-gray-800';
    }
  };
  
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'IMMEDIATE': return { text: '즉시 조치', color: 'bg-red-100 text-red-700' };
      case 'SHORT_TERM': return { text: '단기', color: 'bg-yellow-100 text-yellow-700' };
      case 'LONG_TERM': return { text: '장기', color: 'bg-green-100 text-green-700' };
      default: return { text: category, color: 'bg-gray-100 text-gray-700' };
    }
  };
  
  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => {
        const badge = getCategoryBadge(rec.category);
        
        return (
          <div
            key={index}
            className={`border-l-4 rounded-lg p-6 ${getPriorityColor(rec.priority)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold">{rec.title}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.text}
              </span>
            </div>
            
            <p className="text-gray-700 mb-4">{rec.description}</p>
            
            {rec.actionItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">실행 항목:</h4>
                <ul className="space-y-1">
                  {rec.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1">→</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
