import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import IssueSeverityBadge from './IssueSeverityBadge';
import { ExternalLink, ChevronDown, ChevronUp, Check, AlertCircle, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessibilityNode } from '@/lib/api';

interface IssueCardProps {
  id: string;
  rule: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | 'none' | 'info';
  elements: string[];
  wcagCriteria: string;
  helpUrl: string;
  engine: 'axe' | 'lighthouse';
  help?: string;
  nodes?: AccessibilityNode[];
  isPassing?: boolean;
  needsReview?: boolean;
  inapplicable?: boolean;
}

const IssueCard = ({
  id,
  rule,
  description,
  impact,
  elements,
  wcagCriteria,
  helpUrl,
  engine,
  help,
  nodes = [],
  isPassing = false,
  needsReview = false,
  inapplicable = false
}: IssueCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = () => {
    if (isPassing) return <Check className="h-5 w-5 text-green-500" />;
    if (needsReview) return <HelpCircle className="h-5 w-5 text-amber-500" />;
    if (inapplicable) return null;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const cardVariant = isPassing ? "border-green-200 bg-green-50" : 
                     needsReview ? "border-amber-200 bg-amber-50" :
                     inapplicable ? "border-gray-200 bg-gray-50" : 
                     "border-red-200 bg-red-50";
  
  return (
    <Card className={`mb-4 ${cardVariant}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {statusIcon()}
              <CardTitle>{rule}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <IssueSeverityBadge severity={impact} />
              <Badge variant="secondary">{wcagCriteria}</Badge>
              <Badge variant="outline" className="capitalize">{engine}</Badge>
            </div>
          </div>
          
          {!inapplicable && nodes && nodes.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expanded ? "Hide Details" : "Show Details"}
            </Button>
          )}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
        {help && <p className="text-sm text-muted-foreground mt-1">{help}</p>}
      </CardHeader>
      
      {expanded && !inapplicable && nodes && nodes.length > 0 && (
        <CardContent>
          <Accordion type="single" collapsible className="mb-4">
            {nodes.map((node, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>
                  <div className="flex flex-col items-start text-left">
                    <div className="text-sm font-medium">Element {index + 1}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[500px]">
                      {node.html}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">HTML</h4>
                      <div className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{node.html}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">CSS Selector</h4>
                      <div className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{node.target.join(', ')}</pre>
                      </div>
                    </div>
                    
                    {node.failureSummary && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Failure Summary</h4>
                        <div className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                          <pre className="whitespace-pre-wrap">{node.failureSummary}</pre>
                        </div>
                      </div>
                    )}
                    
                    {(node.any?.length > 0 || node.all?.length > 0 || node.none?.length > 0) && (
                      <Tabs defaultValue="all">
                        <TabsList>
                          {node.all?.length > 0 && <TabsTrigger value="all">All ({node.all.length})</TabsTrigger>}
                          {node.any?.length > 0 && <TabsTrigger value="any">Any ({node.any.length})</TabsTrigger>}
                          {node.none?.length > 0 && <TabsTrigger value="none">None ({node.none.length})</TabsTrigger>}
                        </TabsList>
                        
                        {node.all?.length > 0 && (
                          <TabsContent value="all" className="space-y-2">
                            {node.all.map((check, checkIndex) => (
                              <div key={checkIndex} className="border p-3 rounded-md">
                                <h5 className="text-sm font-medium">{check.id}</h5>
                                <p className="text-xs text-muted-foreground">{check.message}</p>
                                {Object.keys(check.data).length > 0 && (
                                  <div className="mt-2">
                                    <h6 className="text-xs font-medium">Data</h6>
                                    <div className="mt-1 text-xs">
                                      {Object.entries(check.data).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-2 gap-2">
                                          <span className="font-semibold">{key}:</span>
                                          <span>{JSON.stringify(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </TabsContent>
                        )}
                        
                        {node.any?.length > 0 && (
                          <TabsContent value="any" className="space-y-2">
                            {node.any.map((check, checkIndex) => (
                              <div key={checkIndex} className="border p-3 rounded-md">
                                <h5 className="text-sm font-medium">{check.id}</h5>
                                <p className="text-xs text-muted-foreground">{check.message}</p>
                                {Object.keys(check.data).length > 0 && (
                                  <div className="mt-2">
                                    <h6 className="text-xs font-medium">Data</h6>
                                    <div className="mt-1 text-xs">
                                      {Object.entries(check.data).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-2 gap-2">
                                          <span className="font-semibold">{key}:</span>
                                          <span>{JSON.stringify(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </TabsContent>
                        )}
                        
                        {node.none?.length > 0 && (
                          <TabsContent value="none" className="space-y-2">
                            {node.none.map((check, checkIndex) => (
                              <div key={checkIndex} className="border p-3 rounded-md">
                                <h5 className="text-sm font-medium">{check.id}</h5>
                                <p className="text-xs text-muted-foreground">{check.message}</p>
                                {Object.keys(check.data).length > 0 && (
                                  <div className="mt-2">
                                    <h6 className="text-xs font-medium">Data</h6>
                                    <div className="mt-1 text-xs">
                                      {Object.entries(check.data).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-2 gap-2">
                                          <span className="font-semibold">{key}:</span>
                                          <span>{JSON.stringify(value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </TabsContent>
                        )}
                      </Tabs>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <span>Learn More</span>
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        </CardContent>
      )}
      
      {!expanded && (
        <CardContent>
          {!inapplicable && elements.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Affected Elements ({elements.length})</h4>
              <div className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-[200px] overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {elements.map((element, index) => (
                    <div key={index} className="mb-1 last:mb-0">
                      {element}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                <span>Learn More</span>
                <ExternalLink size={14} />
              </a>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default IssueCard;
