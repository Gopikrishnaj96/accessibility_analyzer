
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  description?: string;
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 70) return 'score-average';
  if (score >= 50) return 'score-poor';
  return 'score-bad';
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'bg-pass';
  if (score >= 80) return 'bg-info';
  if (score >= 70) return 'bg-moderate';
  if (score >= 50) return 'bg-serious';
  return 'bg-critical';
};

const ScoreCard = ({ title, score, icon, description }: ScoreCardProps) => {
  const scoreClass = getScoreClass(score);
  const progressColor = getScoreColor(score);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          <span className={scoreClass}>{score}</span>
          <span className="text-muted-foreground text-sm font-normal">/100</span>
        </div>
        <Progress value={score} className="h-2 mt-2" indicatorClassName={progressColor} />
      </CardContent>
    </Card>
  );
};

export default ScoreCard;
