import React from 'react';
import { LighthouseTestResult, LighthouseAudit } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  Zap,
  Search,
  Code2,
  LayoutGrid,
  Image,
  FileCode,
  AlertTriangle
} from 'lucide-react';

interface PerformanceDetailsProps {
  results: LighthouseTestResult | null;
}

// This component is now robust to missing/null fields in Lighthouse results.
// It will render whatever data is available, and show placeholders for missing data.
export default function PerformanceDetails({ results }: PerformanceDetailsProps) {
  if (!results || typeof results !== 'object') {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No performance data available
      </div>
    );
  }
  
  // Handle both API formats (direct scores or nested under lighthouseScores)
  const scores = results.lighthouseScores || results.scores || {};
  
  // Defensive: Use optional chaining and fallback values for all fields
  const audits = results.audits || {};
  const timing = results.timing || results.metrics?.timing || {};
  const resources = results.resources || results.metrics?.resources || {};
  const errors = results.errors || [];
  const screenshots = results.screenshots || {};

  // Group audits by category, but only if audits exist and is an object
  const groupedAudits = typeof audits === 'object' && audits ? 
    Object.values(audits).reduce((groups: Record<string, LighthouseAudit[]>, audit) => {
      if (!audit || typeof audit !== 'object') return groups;
      const category = getAuditCategory(audit.id || '');
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(audit);
      return groups;
    }, {}) 
    : {};

  return (
    <div className="space-y-6">
      {/* Render scores section conditionally */}
      {Object.keys(scores).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Performance" 
            score={typeof scores.performance === 'number' ? scores.performance : null} 
            icon={<Zap className="h-5 w-5" />}
            description="Page speed & loading"
          />
          <MetricCard 
            title="Accessibility" 
            score={typeof scores.accessibility === 'number' ? scores.accessibility : null} 
            icon={<LayoutGrid className="h-5 w-5" />}
            description="Usability for all users"
          />
          <MetricCard 
            title="SEO" 
            score={typeof scores.seo === 'number' ? scores.seo : null} 
            icon={<Search className="h-5 w-5" />}
            description="Search engine optimization"
          />
          <MetricCard 
            title="Best Practices" 
            score={typeof scores.bestPractices === 'number' ? scores.bestPractices : null} 
            icon={<Code2 className="h-5 w-5" />}
            description="Web development standards"
          />
        </div>
      )}

      {/* Render timing section conditionally */}
      {Object.keys(timing).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Key Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <TimingCard
              metric="First Contentful Paint"
              value={timing.firstContentfulPaint ?? null}
              unit="ms"
              description="Time until first content is painted"
            />
            <TimingCard
              metric="Largest Contentful Paint"
              value={timing.largestContentfulPaint ?? null}
              unit="ms"
              description="Time until largest content is painted"
              important
            />
            <TimingCard
              metric="Time to Interactive"
              value={timing.timeToInteractive ?? null}
              unit="ms"
              description="Time until page is fully interactive"
            />
            <TimingCard
              metric="Speed Index"
              value={timing.speedIndex ?? null}
              unit="ms"
              description="How quickly content is visually displayed"
            />
            <TimingCard
              metric="Total Blocking Time"
              value={timing.totalBlockingTime ?? null}
              unit="ms"
              description="Sum of blocking time on main thread"
              important
            />
            <TimingCard
              metric="Cumulative Layout Shift"
              value={timing.cumulativeLayoutShift ?? null}
              unit=""
              description="Unexpected layout shifts during loading"
              important
            />
          </div>
        </div>
      )}

      {/* Render resources section conditionally */}
      {Object.keys(resources).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Resource Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ResourceSummaryCard
              title="Total Resources"
              count={resources.total ?? 'N/A'}
              icon={<FileCode className="h-5 w-5" />}
            />
            {resources.byType && typeof resources.byType === 'object' && Object.entries(resources.byType).map(([type, count]) => (
              <ResourceSummaryCard
                key={type}
                title={capitalizeFirstLetter(type)}
                count={count}
                icon={getResourceIcon(type)}
              />
            ))}
            <ResourceSummaryCard
              title="Total Size"
              count={typeof resources.transferSize === 'number' ? formatBytes(resources.transferSize) : 'N/A'}
              icon={<FileCode className="h-5 w-5" />}
            />
          </div>
        </div>
      )}

      {/* Show errors only if they exist */}
      {Array.isArray(errors) && errors.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Errors</h2>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {errors.length} Error{errors.length !== 1 ? 's' : ''} Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Only show audit tabs if there are audits to display */}
      {Object.keys(groupedAudits).length > 0 && (
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>
          
          {Object.entries(groupedAudits).map(([category, audits]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <Accordion type="single" collapsible>
                {audits
                  .filter(audit => audit && typeof audit === 'object')
                  .sort((a, b) => {
                    // Sort null scores to the bottom
                    if (a.score === null && b.score !== null) return 1;
                    if (a.score !== null && b.score === null) return -1;
                    // Sort by score (ascending, so worst scores first)
                    if (a.score !== null && b.score !== null) return a.score - b.score;
                    return 0;
                  })
                  .map(audit => (
                    <AccordionItem key={audit.id || Math.random().toString()} value={audit.id || Math.random().toString()}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <AuditStatusIndicator score={audit.score} />
                            <span>{audit.title || 'Unnamed audit'}</span>
                          </div>
                          {audit.displayValue && (
                            <span className="text-xs text-muted-foreground">{audit.displayValue}</span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 text-sm">
                          <p>{audit.description}</p>
                          {/* Defensive: Only render details if present and valid */}
                          {audit.details && audit.details.items && Array.isArray(audit.details.items) && audit.details.items.length > 0 ? (
                            <div className="mt-2">
                              <h5 className="font-medium text-sm mb-1">Details</h5>
                              <div className="bg-muted p-2 rounded-md overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr>
                                      {audit.details.headings?.map((heading: any, i: number) => (
                                        <th key={i} className="text-left p-1 border-b">
                                          {heading.text || heading.label || heading.key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {audit.details.items.map((item: any, i: number) => (
                                      <tr key={i} className="border-b border-gray-200 last:border-0">
                                        {audit.details.headings?.map((heading: any, j: number) => {
                                          const key = heading.key;
                                          const value = item[key];
                                          return (
                                            <td key={j} className="p-1 overflow-hidden text-ellipsis">
                                              {formatAuditValue(value)}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">No details available.</div>
                          )}
                          {/* Defensive: Show potential savings if present */}
                          {audit.details?.overallSavingsMs && (
                            <div className="mt-2">
                              <h5 className="font-medium text-sm mb-1">Potential Savings</h5>
                              <p>Time: {audit.details.overallSavingsMs}ms</p>
                              {audit.details.overallSavingsBytes && (
                                <p>Size: {formatBytes(audit.details.overallSavingsBytes)}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {screenshots?.thumbnails && Array.isArray(screenshots.thumbnails) && screenshots.thumbnails.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Page Load Filmstrip</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {screenshots.thumbnails.map((thumbnail, index) => (
              <div key={index} className="border rounded-md overflow-hidden">
                <img 
                  src={thumbnail} 
                  alt={`Page load step ${index + 1}`} 
                  className="w-full h-auto"
                />
                <div className="p-2 bg-muted text-center text-xs">
                  Frame {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 border border-dashed rounded-md text-center text-muted-foreground space-y-2">
          <p>No filmstrip available for this page.</p>
          <p className="text-sm">This might be due to a faster page load, a server configuration, or screenshots being disabled.</p>
        </div>
      )}
    </div>
  );
}

// Helper components
function MetricCard({ title, score, icon, description }: { 
  title: string, 
  score: number | null, 
  icon: React.ReactNode,
  description: string 
}) {
  const scoreColor = score >= 0.9 ? 'text-green-500' : 
                     score >= 0.5 ? 'text-amber-500' : 
                     'text-red-500';
                     
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex gap-2 text-base items-center">
            {icon}
            {title}
          </CardTitle>
          <div className={`text-xl font-bold ${scoreColor}`}>
            {score ? Math.round(score * 100) : 'N/A'}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function TimingCard({ metric, value, unit, description, important = false }: {
  metric: string,
  value: number | null,
  unit: string,
  description: string,
  important?: boolean
}) {
  // Speed assessment based on typical performance metrics
  const getSpeedAssessment = (metric: string, value: number) => {
    if (metric.includes('Contentful Paint') && value < 1800) return 'Fast';
    if (metric.includes('Contentful Paint') && value < 3000) return 'Moderate';
    if (metric.includes('Contentful Paint')) return 'Slow';
    
    if (metric === 'Time to Interactive' && value < 3500) return 'Fast';
    if (metric === 'Time to Interactive' && value < 7500) return 'Moderate';
    if (metric === 'Time to Interactive') return 'Slow';
    
    if (metric === 'Speed Index' && value < 3400) return 'Fast';
    if (metric === 'Speed Index' && value < 5800) return 'Moderate';
    if (metric === 'Speed Index') return 'Slow';
    
    if (metric === 'Total Blocking Time' && value < 200) return 'Fast';
    if (metric === 'Total Blocking Time' && value < 600) return 'Moderate';
    if (metric === 'Total Blocking Time') return 'Slow';
    
    if (metric === 'Cumulative Layout Shift' && value < 0.1) return 'Fast';
    if (metric === 'Cumulative Layout Shift' && value < 0.25) return 'Moderate';
    if (metric === 'Cumulative Layout Shift') return 'Slow';
    
    return 'Unknown';
  };
  
  const assessment = value ? getSpeedAssessment(metric, value) : 'Unknown';
  
  const getSpeedColor = (assessment: string) => {
    if (assessment === 'Fast') return 'text-green-500';
    if (assessment === 'Moderate') return 'text-amber-500';
    return 'text-red-500';
  };
  
  const color = getSpeedColor(assessment);
  
  return (
    <Card className={important ? 'border-blue-200' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {metric}
          {important && <span className="text-xs text-blue-500">(Core Web Vital)</span>}
        </CardTitle>
        <div className="flex justify-between items-center">
          <CardDescription>{description}</CardDescription>
          <div className={`font-semibold ${color}`}>
            {value ? (
              <>
                {metric === 'Cumulative Layout Shift' ? value.toFixed(3) : value.toLocaleString()}
                {unit && <span className="text-xs ml-1">{unit}</span>}
              </>
            ) : 'N/A'}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function ResourceSummaryCard({ title, count, icon }: {
  title: string,
  count: number | string,
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <div className="text-xl font-bold">{count}</div>
      </CardHeader>
    </Card>
  );
}

function AuditStatusIndicator({ score }: { score: number | null }) {
  if (score === null) {
    return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  }
  
  if (score >= 0.9) {
    return <div className="w-3 h-3 rounded-full bg-green-500" />;
  }
  
  if (score >= 0.5) {
    return <div className="w-3 h-3 rounded-full bg-amber-500" />;
  }
  
  return <div className="w-3 h-3 rounded-full bg-red-500" />;
}

// Helper functions
function getAuditCategory(auditId: string): string {
  if (auditId.startsWith('performance') || 
      ['speed-index', 'interactive', 'first-contentful-paint', 'largest-contentful-paint'].includes(auditId)) {
    return 'performance';
  }
  
  if (auditId.startsWith('accessibility') || auditId.includes('a11y')) {
    return 'accessibility';
  }
  
  if (auditId.startsWith('seo') || auditId.includes('search')) {
    return 'seo';
  }
  
  return 'best-practices';
}

function getResourceIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'document':
      return <FileCode className="h-5 w-5" />;
    case 'image':
      return <Image className="h-5 w-5" />;
    case 'script':
      return <Code2 className="h-5 w-5" />;
    case 'stylesheet':
      return <FileCode className="h-5 w-5" />;
    default:
      return <FileCode className="h-5 w-5" />;
  }
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatAuditValue(value: any): React.ReactNode {
  if (value === undefined || value === null) return '-';
  
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  
  if (typeof value === 'number') return value.toLocaleString();
  
  if (typeof value === 'object') return JSON.stringify(value);
  
  return String(value);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 