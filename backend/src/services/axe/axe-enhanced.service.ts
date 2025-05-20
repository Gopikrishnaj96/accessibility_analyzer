import { AxeService } from './axe.service';
import { axeConfig } from '../../config/axe.config';
import { WCAG_MAPPING } from '../../constants/wcag';

// Define TypeScript interfaces for better type safety
type ImpactLevel = 'minor' | 'moderate' | 'serious' | 'critical';

interface Violation {
  id: string;
  impact: ImpactLevel;
  tags: string[];
  nodes: Array<{ html: string }>;
  description: string;
  // Add other violation properties as needed
}

interface EnhancedViolation extends Violation {
  wcagCriteria: string[];
  priorityScore: number;
}

export class EnhancedAxeService extends AxeService {
  async runEnhancedAnalysis(url: string): Promise<{
    violations: EnhancedViolation[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  }> {
    const rawResults = await this.testUrl(url);
    
    return {
      ...rawResults,
      violations: this.mapToWCAG(rawResults.violations),
      passes: rawResults.passes,
      incomplete: rawResults.incomplete,
      inapplicable: rawResults.inapplicable
    };
  }

  private mapToWCAG(violations: Violation[]): EnhancedViolation[] {
    return violations.map(violation => ({
      ...violation,
      wcagCriteria: violation.tags
        .filter(tag => tag.startsWith('wcag'))
        .map(tag => WCAG_MAPPING[tag] || tag),
      priorityScore: this.calculatePriorityScore(violation)
    }));
  }

  private calculatePriorityScore(violation: Violation): number {
    const IMPACT_WEIGHTS: Record<ImpactLevel, number> = {
      minor: 1,
      moderate: 2,
      serious: 3,
      critical: 4
    };

    return IMPACT_WEIGHTS[violation.impact] * violation.nodes.length;
  }
}
