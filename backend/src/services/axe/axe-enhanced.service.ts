import { AxeService } from './axe.service';
import { axeConfig } from '../../config/axe.config';
import { WCAG_MAPPING } from '../../constants/wcag';

// Define TypeScript interfaces for better type safety
type ImpactLevel = 'minor' | 'moderate' | 'serious' | 'critical';

interface ViolationFix {
  message: string;
  samples?: string[];
}

interface Violation {
  id: string;
  impact: ImpactLevel;
  tags: string[];
  nodes: Array<{ html: string }>;

  description: string;
  fix?: ViolationFix;  // Add optional fix property
}

interface EnhancedViolation extends Violation {
  wcagCriteria: string[];
  priorityScore: number;
}

export class EnhancedAxeService extends AxeService {
  /**
   * Runs an enhanced accessibility analysis on the specified URL
   * @param url - The URL to analyze
   * @returns Enhanced analysis results including WCAG mappings and priority scores
   */
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
      priorityScore: this.calculatePriorityScore(violation),
      fix: this.addFixSamples(violation) || undefined  // Convert null to undefined
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

  private addFixSamples(violation: Violation): ViolationFix | undefined {
    const fixes: Record<string, ViolationFix> = {
      'html-has-lang': {
        message: 'Add lang attribute to <html> element',
        samples: ['<html lang="en">', '<html lang="es">']
      },
      'image-alt': {
        message: 'Add descriptive alt text to images',
        samples: [
          '<img src="logo.jpg" alt="Company Logo">',
          '<img src="banner.jpg" alt="Summer Sale - 50% off all items">'
        ]
      },
      'button-name': {
        message: 'Ensure buttons have accessible names',
        samples: [
          '<button aria-label="Menu">☰</button>',
          '<button>Submit Form</button>'
        ]
      },
      'color-contrast': {
        message: 'Ensure sufficient color contrast between text and background',
        samples: [
          '<p style="color: #333333; background-color: #ffffff">Good contrast</p>',
          '<div style="color: #222222; background-color: #f5f5f5">Readable text</div>'
        ]
      }
    };
    
    const fixInfo = fixes[violation.id];
    return fixInfo ? {
      message: fixInfo.message,
      samples: fixInfo.samples
    } : undefined;  // Return undefined instead of null
  }
}
