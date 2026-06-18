export const conversations = [
  {
    id: 'henderson-trust',
    title: 'Henderson Trust — distribution clause review',
    preview: 'Reviewed Section 7.2 re: discretionary distributions',
    timestamp: 'Today, 11:42 AM',
    active: true,
    messages: [
      {
        id: 1,
        role: 'user',
        content: null,
        attachment: {
          name: 'Henderson_Family_Trust.pdf',
          size: '1.2 MB',
          pages: 47,
        },
        timestamp: '11:38 AM',
      },
      {
        id: 2,
        role: 'user',
        content: 'Can you find the clause about discretionary distributions and summarize what triggers them?',
        timestamp: '11:39 AM',
      },
      {
        id: 3,
        role: 'assistant',
        content: null,
        type: 'distribution-clause',
        timestamp: '11:40 AM',
      },
      {
        id: 4,
        role: 'user',
        content: 'Can you build a quick spreadsheet comparing this to a standard discretionary trust?',
        timestamp: '11:41 AM',
      },
      {
        id: 5,
        role: 'assistant',
        content: null,
        type: 'spreadsheet-comparison',
        timestamp: '11:42 AM',
      },
    ],
  },
  {
    id: 'martinez-meeting',
    title: 'Martinez annuity comparison',
    preview: 'Pulled contact notes and annuity details before 2pm',
    timestamp: 'Today, 1:58 PM',
    active: false,
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Pull everything relevant before my 2pm with the Martinez family.',
        timestamp: '1:55 PM',
      },
      {
        id: 2,
        role: 'assistant',
        content: null,
        type: 'martinez-briefing',
        timestamp: '1:58 PM',
      },
    ],
  },
  {
    id: 'q3-rebalance',
    title: 'Q3 portfolio rebalance notes',
    preview: 'Drafted rebalance memo for review committee',
    timestamp: 'Yesterday',
    active: false,
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Summarize the Q3 rebalance rationale for the review committee memo.',
        timestamp: '3:22 PM',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Here is a draft summary for the Q3 rebalance memo…',
        type: 'simple',
        timestamp: '3:23 PM',
      },
    ],
  },
  {
    id: 'thompson-onboarding',
    title: 'Client onboarding — Thompson',
    preview: 'Generated welcome packet and suitability checklist',
    timestamp: 'Jun 15',
    active: false,
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Generate a welcome packet outline and suitability questionnaire for the Thompson account.',
        timestamp: '10:05 AM',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Draft welcome packet and suitability checklist generated.',
        type: 'simple',
        timestamp: '10:06 AM',
      },
    ],
  },
  {
    id: 'chen-estate',
    title: 'Chen estate — beneficiary review',
    preview: 'Identified three outdated beneficiary designations',
    timestamp: 'Jun 12',
    active: false,
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Review the Chen estate documents for any outdated beneficiary designations.',
        timestamp: '2:14 PM',
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Three outdated beneficiary designations identified across IRA, 401(k), and life policy.',
        type: 'simple',
        timestamp: '2:15 PM',
      },
    ],
  },
];

export const tools = [
  {
    id: 'doc-analysis',
    label: 'Document Analysis',
    icon: '📄',
    status: 'active',
  },
  {
    id: 'spreadsheet',
    label: 'Spreadsheet Builder',
    icon: '📊',
    status: 'coming-soon',
  },
  {
    id: 'report',
    label: 'Report Generator',
    icon: '📋',
    status: 'coming-soon',
  },
];
