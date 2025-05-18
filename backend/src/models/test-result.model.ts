import mongoose, { Document, Schema } from 'mongoose';

// Interface representing a test result document
export interface ITestResult extends Document {
  url: string;
  timestamp: Date;
  summary: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
    score: number;
  };
  results: {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
  testEngine: {
    name: string;
    version: string;
  };
}

// Schema definition
const TestResultSchema: Schema = new Schema({
  url: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  summary: {
    violations: Number,
    passes: Number,
    incomplete: Number,
    inapplicable: Number,
    score: Number
  },
  results: {
    violations: Array,
    passes: Array,
    incomplete: Array,
    inapplicable: Array
  },
  testEngine: {
    name: String,
    version: String
  }
});

// Create and export the model
export default mongoose.model<ITestResult>('TestResult', TestResultSchema);
