import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

const processResources = (audits: any) => {
  const resourceItems = audits['resource-summary']?.details?.items || [];
  const resources = {
    total: 0,
    byType: new Map<string, number>(),
    transferSize: 0
  };

  resourceItems.forEach((item: any) => {
    if (item.resourceType && item.transferSize) {
      resources.total += 1;
      resources.transferSize += item.transferSize;
      resources.byType.set(
        item.resourceType,
        (resources.byType.get(item.resourceType) || 0) + 1
      );
    }
  });

  return resources;
};

const extractTimingMetrics = (audits: any) => ({
  firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
  largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
  timeToInteractive: audits['interactive']?.numericValue || 0,
  speedIndex: audits['speed-index']?.numericValue || 0,
  totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
  cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0
});

export class LighthouseService {
  async runLighthouse(url: string) {
    let chrome;
    try {
      chrome = await launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
      });
      
      const options = {
        port: chrome.port,
        output: 'json' as const,
        logLevel: 'info' as const,
        onlyCategories: ['accessibility', 'performance', 'best-practices', 'seo']
      };
      
      const runnerResult = await lighthouse(url, options);
      
      if (!runnerResult?.lhr?.categories) {
        throw new Error('Lighthouse returned invalid results');
      }

      const getScore = (category: string) => {
        const score = runnerResult.lhr.categories[category]?.score;
        return score !== null && score !== undefined ? Math.round(score * 100) : 0;
      };

      const audits = runnerResult.lhr.audits || {};
      const timing = extractTimingMetrics(audits);
      const resources = processResources(audits);

      return {
        url: runnerResult.lhr.finalUrl || url,
        scores: {
          performance: getScore('performance'),
          accessibility: getScore('accessibility'),
          seo: getScore('seo'),
          bestPractices: getScore('best-practices')
        },
        timing,
        resources,
        lighthouseVersion: runnerResult.lhr.lighthouseVersion || 'unknown'
      };
    } catch (error) {
      console.error('Lighthouse error details:', error);
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        scores: { performance: 0, accessibility: 0, seo: 0, bestPractices: 0 },
        timing: {
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          timeToInteractive: 0,
          speedIndex: 0,
          totalBlockingTime: 0,
          cumulativeLayoutShift: 0
        },
        resources: { total: 0, byType: new Map(), transferSize: 0 },
        lighthouseVersion: 'unknown'
      };
    } finally {
      if (chrome) await chrome.kill();
    }
  }
}
