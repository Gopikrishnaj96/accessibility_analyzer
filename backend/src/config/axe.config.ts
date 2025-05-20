export const axeConfig = {
  rules: [{
    id: 'color-contrast',
    enabled: true,
    reviewOnFail: true // Flag for manual review
  }],
  checks: [{
    id: 'color-contrast',
    options: {
      contrastThreshold: 4.5 // WCAG AA standard
    }
  }],
  tags: ['wcag21aa', 'best-practice', 'ACT'],
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21aa']
  }
};
