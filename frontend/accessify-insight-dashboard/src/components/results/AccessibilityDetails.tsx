import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccessibilityTestResult } from '@/lib/api';
import IssueCard from './IssueCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AccessibilityDetailsProps {
  results: AccessibilityTestResult;
}

export default function AccessibilityDetails({ results }: AccessibilityDetailsProps) {
  if (!results || !results.results) {
    return <div>No accessibility data available</div>;
  }

  const { violations, passes, incomplete, inapplicable } = results.results;
  const { summary } = results;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Violations
              <Badge variant="destructive">{summary.violations}</Badge>
            </CardTitle>
            <CardDescription>Failed accessibility checks</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Passes
              <Badge variant="success">{summary.passes}</Badge>
            </CardTitle>
            <CardDescription>Passed accessibility checks</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Incomplete
              <Badge variant="secondary">{summary.incomplete}</Badge>
            </CardTitle>
            <CardDescription>Need manual verification</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Inapplicable
              <Badge variant="outline">{summary.inapplicable}</Badge>
            </CardTitle>
            <CardDescription>Rules that don't apply</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="violations" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="violations">Violations ({violations?.length || 0})</TabsTrigger>
          <TabsTrigger value="passes">Passes ({passes?.length || 0})</TabsTrigger>
          <TabsTrigger value="incomplete">Incomplete ({incomplete?.length || 0})</TabsTrigger>
          <TabsTrigger value="inapplicable">Inapplicable ({inapplicable?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="violations" className="space-y-4">
          {violations && violations.length > 0 ? (
            violations.map(issue => (
              <IssueCard 
                key={issue.id}
                id={issue.id}
                rule={issue.id}
                description={issue.description}
                impact={issue.impact || 'minor'}
                elements={issue.nodes.map(node => node.html)}
                wcagCriteria={getWcagFromTags(issue.tags)}
                helpUrl={issue.helpUrl}
                engine="axe"
                help={issue.help}
                nodes={issue.nodes}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No violations found. Great job!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="passes" className="space-y-4">
          {passes && passes.length > 0 ? (
            passes.map(issue => (
              <IssueCard 
                key={issue.id}
                id={issue.id}
                rule={issue.id}
                description={issue.description}
                impact="none"
                elements={issue.nodes.map(node => node.html)}
                wcagCriteria={getWcagFromTags(issue.tags)}
                helpUrl={issue.helpUrl}
                engine="axe"
                help={issue.help}
                nodes={issue.nodes}
                isPassing={true}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No passing checks recorded.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="incomplete" className="space-y-4">
          {incomplete && incomplete.length > 0 ? (
            incomplete.map(issue => (
              <IssueCard 
                key={issue.id}
                id={issue.id}
                rule={issue.id}
                description={issue.description}
                impact={issue.impact || 'moderate'}
                elements={issue.nodes.map(node => node.html)}
                wcagCriteria={getWcagFromTags(issue.tags)}
                helpUrl={issue.helpUrl}
                engine="axe"
                help={issue.help}
                nodes={issue.nodes}
                needsReview={true}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No checks require manual verification.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="inapplicable" className="space-y-4">
          {inapplicable && inapplicable.length > 0 ? (
            inapplicable.map(issue => (
              <IssueCard 
                key={issue.id}
                id={issue.id}
                rule={issue.id}
                description={issue.description}
                impact="none"
                elements={[]}
                wcagCriteria={getWcagFromTags(issue.tags)}
                helpUrl={issue.helpUrl}
                engine="axe"
                help={issue.help}
                nodes={[]}
                inapplicable={true}
              />
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p>No inapplicable rules recorded.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to extract WCAG criteria from tags
function getWcagFromTags(tags: string[]): string {
  const wcagTag = tags.find(tag => tag.startsWith('wcag'));
  return wcagTag 
    ? `WCAG ${wcagTag.substring(4, 5)}.${wcagTag.substring(5, 6)}.${wcagTag.substring(6, 7)} ${wcagTag.substring(7).toUpperCase()}`
    : 'No WCAG mapping';
} 