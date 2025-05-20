import mongoose, { Document, Schema } from 'mongoose';

export interface ITestResult extends Document {
  url: string;
  timestamp: Date;
  testType: 'axe' | 'lighthouse';
  axeSummary?: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
    score: number;
  };
  axeResults?: {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
  lighthouseScores?: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  lighthouseMetrics?: {
    timing: {
      firstContentfulPaint: number;
      largestContentfulPaint: number;
      timeToInteractive: number;
      speedIndex: number;
      totalBlockingTime: number;
      cumulativeLayoutShift: number;
    };
    resources: {
      total: number;
      byType: Map<string, number>;
      transferSize: number;
    };
  };
  testEngine: {
    name: string;
    version: string;
  };
}

const TestResultSchema: Schema = new Schema({
  url: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  testType: { type: String, enum: ['axe', 'lighthouse'], required: true },
  axeSummary: {
    violations: Number,
    passes: Number,
    incomplete: Number,
    inapplicable: Number,
    score: Number
  },
  axeResults: {
    violations: [{
      id: String,
      impact: String,
      tags: [String],
      nodes: Array,
      wcagCriteria: [String],
      priorityScore: Number
    }],
    passes: Array,
    incomplete: Array,
    inapplicable: Array
  },
  lighthouseScores: {
    performance: Number,
    accessibility: Number,
    seo: Number,
    bestPractices: Number
  },
  lighthouseMetrics: {
    timing: {
      firstContentfulPaint: Number,
      largestContentfulPaint: Number,
      timeToInteractive: Number,
      speedIndex: Number,
      totalBlockingTime: Number,
      cumulativeLayoutShift: Number
    },
    resources: {
      total: Number,
      byType: Map,
      transferSize: Number
    }
  },
  testEngine: {
    name: String,
    version: String
  }
});

export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
