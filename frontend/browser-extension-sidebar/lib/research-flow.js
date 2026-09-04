// Demo Flow 3: Research
export const RESEARCH_FLOW = {
  id: 'research',
  name: 'Research',
  userMessage: 'Research the latest developments in AI agent technology and summarize',
  steps: [
    { id: 1, label: 'Planning research strategy', duration: 1000 },
    { id: 2, label: 'Searching "AI agent technology 2026"', duration: 1500, action: { type: 'search', query: 'AI agent technology 2026' } },
    { id: 3, label: 'Opening first result: TechCrunch article', duration: 1000, action: { type: 'navigate', url: 'techcrunch.com' } },
    { id: 4, label: 'Extracting key points', duration: 2000 },
    { id: 5, label: 'Navigating to second source: ArXiv', duration: 1500, action: { type: 'navigate', url: 'arxiv.org' } },
    { id: 6, label: 'Reading recent papers', duration: 2500 },
    { id: 7, label: 'Opening third source: GitHub trends', duration: 1000, action: { type: 'navigate', url: 'github.com/trending' } },
    { id: 8, label: 'Analyzing popular repositories', duration: 2000 },
    { id: 9, label: 'Cross-referencing information', duration: 1500 },
    { id: 10, label: 'Identifying key trends', duration: 1500 },
    { id: 11, label: 'Organizing findings', duration: 2000 },
    { id: 12, label: 'Generating summary', duration: 2500 },
  ],
  result: {
    type: 'research-summary',
    title: 'AI Agent Technology: 2026 Developments',
    sections: [
      {
        title: 'Key Developments',
        points: [
          'Multi-modal agents can now process text, images, and video simultaneously',
          'Browser automation has become more reliable with computer vision integration',
          'Self-healing agents can recover from errors without human intervention',
          'Agent-to-agent collaboration is emerging as a major trend'
        ]
      },
      {
        title: 'Notable Projects',
        items: [
          { name: 'AutoGPT v2', description: 'Autonomous task completion framework', stars: '156k' },
          { name: 'BrowserGPT', description: 'AI browser automation toolkit', stars: '89k' },
          { name: 'AgentForge', description: 'Multi-agent orchestration platform', stars: '67k' }
        ]
      },
      {
        title: 'Industry Trends',
        points: [
          'Enterprise adoption increasing rapidly',
          'Focus on reliability and safety',
          'Integration with existing workflows',
          'Regulatory frameworks being developed'
        ]
      }
    ],
    sources: [
      'TechCrunch: "The Rise of Autonomous AI Agents" (Sept 2026)',
      'ArXiv: Recent papers on agent architectures',
      'GitHub Trending: Top AI agent projects'
    ]
  }
};
