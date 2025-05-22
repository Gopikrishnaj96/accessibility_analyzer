import mongoose, { Document, Schema } from 'mongoose';

export interface ITestResult extends Document {
  url: string;
  timestamp: Date;
  testType: 'axe' | 'lighthouse' | 'combined';  // Added 'combined' type
  axeSummary?: {
    violations: number;
    passes: number;
    score: number;
    incomplete?: number;    // Made optional
    inapplicable?: number; // Made optional
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
    axeVersion?: string;    // Added for combined tests
    lighthouseVersion?: string; // Added for combined tests
  };
  lighthouseOpportunities?: {
    id: string;
    title: string;
    description: string;
    score: number;
    numericValue: number;
    numericUnit: string;
    details: any; // Consider defining a more specific type if possible
  }[];
  lighthouseDiagnostics?: {
    id: string;
    title: string;
    description: string;
    details: any; // Consider defining a more specific type if possible
  }[];
}

const TestResultSchema: Schema = new Schema({
  url: { type: String, required: true, index: true },
  timestamp: { type: Date, default: Date.now },
  testType: { 
    type: String, 
    enum: ['axe', 'lighthouse', 'combined'], 
    required: true 
  },
  axeSummary: {
    violations: Number,
    passes: Number,
    score: Number,
    incomplete: Number,    // Kept for backward compatibility
    inapplicable: Number  // Kept for backward compatibility
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
    version: String,
    axeVersion: String,
    lighthouseVersion: String
  },
  lighthouseOpportunities: [{
    id: String,
    title: String,
    description: String,
    score: Number,
    numericValue: Number,
    numericUnit: String,
    details: Schema.Types.Mixed
  }],
  lighthouseDiagnostics: [{
    id: String,
    title: String,
    description: String,
    details: Schema.Types.Mixed
  }]
});

export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
