
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HistoryItem {
  id: string;
  url: string;
  date: string;
  accessibilityScore: number;
  performanceScore: number;
  seoScore: number;
  bestPracticesScore: number;
  issuesCount: number;
}

interface TestHistoryTableProps {
  history: HistoryItem[];
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 70) return 'score-average';
  if (score >= 50) return 'score-poor';
  return 'score-bad';
};

const TestHistoryTable = ({ history }: TestHistoryTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted border-b">
            <th className="text-left py-3 px-4 font-medium">URL</th>
            <th className="text-center py-3 px-2 font-medium">Date</th>
            <th className="text-center py-3 px-2 font-medium">A11y</th>
            <th className="text-center py-3 px-2 font-medium">Perf</th>
            <th className="text-center py-3 px-2 font-medium">SEO</th>
            <th className="text-center py-3 px-2 font-medium">Best Practices</th>
            <th className="text-center py-3 px-2 font-medium">Issues</th>
            <th className="text-center py-3 px-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4 max-w-xs truncate">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {item.url}
                  <ExternalLink size={14} />
                </a>
              </td>
              <td className="py-3 px-2 text-center">
                <Badge variant="outline">{item.date}</Badge>
              </td>
              <td className="py-3 px-2 text-center">
                <span className={getScoreClass(item.accessibilityScore)}>
                  {item.accessibilityScore}
                </span>
              </td>
              <td className="py-3 px-2 text-center">
                <span className={getScoreClass(item.performanceScore)}>
                  {item.performanceScore}
                </span>
              </td>
              <td className="py-3 px-2 text-center">
                <span className={getScoreClass(item.seoScore)}>
                  {item.seoScore}
                </span>
              </td>
              <td className="py-3 px-2 text-center">
                <span className={getScoreClass(item.bestPracticesScore)}>
                  {item.bestPracticesScore}
                </span>
              </td>
              <td className="py-3 px-2 text-center">
                <span>{item.issuesCount}</span>
              </td>
              <td className="py-3 px-4">
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/results/${item.id}`}>View</Link>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TestHistoryTable;
