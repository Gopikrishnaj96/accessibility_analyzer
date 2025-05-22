import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';

export interface TestOptions {
  rules?: string[];
  timeout?: number;
}

export interface TestResult {
  url: string;
  timestamp: Date;
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
  testEngine: {
    name: string;
    version: string;
  };
}

export class AxeService {
  async testUrl(url: string, options: TestOptions = {}): Promise<TestResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    try {
      console.log(`Testing URL: ${url}`);
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      
      // Navigate to the URL with timeout
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || 30000
      });
      
      // Initialize AxePuppeteer
      let axeBuilder = new AxePuppeteer(page);
      
      // Only apply withRules if rules are specified and non-empty
      if (options.rules && options.rules.length > 0) {
        axeBuilder = axeBuilder.withRules(options.rules);
      }
      
      // Run analysis
      const results = await axeBuilder.analyze();
      
      return {
        url,
        timestamp: new Date(),
        violations: results.violations,
        passes: results.passes,
        incomplete: results.incomplete,
        inapplicable: results.inapplicable,
        testEngine: results.testEngine
      };
    } catch (error) {
      console.error('Error running axe test:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
