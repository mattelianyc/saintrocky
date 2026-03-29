export const saintRockyBranding = {
  companyName: "Saint Rocky",
  productName: "Standard Deviants",
  shortProductName: "std/dev",
  wordmark: "STANDARD DEVIANTS",
  monogramLines: ["STD", "DEV"],
  namespace: "saintrocky",
  siteUrl: "",
  title: "Saint Rocky",
  description:
    "Standard Deviants is a Solana-native discipline enforcement platform for crypto traders. Set rules, stake escrow, pay fees when you break them, and earn dividends for staying disciplined.",
  footerDescription:
    "On-chain escrow enforcement, real-time trade monitoring, discipline leaderboard, and community-driven rule templates for Solana traders.",
  hero: {
    eyebrow: "Solana-native discipline enforcement",
    heading: "Choke the noise. Protect the flow state.",
    summary:
      "Standard Deviants brings browser controls, desktop enforcement, and on-chain escrow into one system built for crypto traders who need their machine to obey their intent.",
    terminalPrompt: "saintrocky@stddev:~$ ",
    terminalLines: [
      "boot standard-deviants --surface web --mode focus",
      "attach browser protection --profile workspace",
      "prepare desktop enforcement --scope network",
      "sync mobile legitimacy --platform ios,android",
      "open control plane --route /(dashboard)"
    ],
    scrollTargetId: "marketing-products-section"
  },
  social: {
    handle: "@standarddeviants",
    url: "https://www.instagram.com/standarddeviants"
  },
  marketingOverview: {
    eyebrow: "Built for degen traders who want guardrails",
    heading: "Write the rule. Stake the escrow. Get paid for discipline.",
    summary:
      "Set the rule. Overrides cost money from your on-chain escrow. Half the net gets paid back to the traders who keep it together.",
    corePillars: [
      {
        title: "Escrow-backed enforcement",
        summary: "Stake SOL into your vault. Break your own rule, penalty gets deducted on-chain."
      },
      {
        title: "Discipline earns the rebate",
        summary: "The cleaner the behavior, the bigger the payout from the fee pool."
      },
      {
        title: "On-chain transparency",
        summary: "Every penalty and reward is verifiable on Solana. No trust required."
      }
    ],
    leaderboard: {
      title: "Realtime discipline leaderboard",
      summary: "Live ranking, live drift, live shame management.",
      visibilityLabel: "Visibility toggle",
      payoutLabel: "Discipline dividend",
      items: [
        {
          displayName: "Maya Chen",
          visibility: "Public",
          dividend: "Highest share",
          disciplineScore: 98,
          delta: "+1"
        },
        {
          displayName: "Owen Hart",
          visibility: "Public",
          dividend: "Gradient payout",
          disciplineScore: 94,
          delta: "-1"
        },
        {
          displayName: "Hidden trader",
          visibility: "Private",
          dividend: "Still eligible",
          disciplineScore: 91,
          delta: "+2"
        }
      ]
    },
    ecosystemPillars: [
      {
        title: "Forum over isolation",
        summary: "Think Reddit for process, accountability, and post-trade honesty."
      },
      {
        title: "AI makes the rule enforceable",
        summary: "Messy intent gets clarified before the app lets it become policy."
      },
      {
        title: "Built for retail chaos",
        summary: "Not productivity theater. Behavioral guardrails for actual degens."
      }
    ]
  },
  featureMatrix: [
    {
      name: "On-chain escrow",
      summary:
        "Deposit SOL into your vault. Penalties auto-deduct when you violate your own rules. Rewards flow back to the disciplined."
    },
    {
      name: "Trade monitoring",
      summary:
        "Real-time Solana transaction monitoring via Helius webhooks. Detects trades on Pump.fun, Jupiter, Raydium, and more."
    },
    {
      name: "Cross-surface enforcement",
      summary:
        "Browser extension blocks trading domains, desktop app detects trading apps, chain watcher catches on-chain violations."
    }
  ],
  supportedPlatforms: [
    "Web control plane",
    "Browser extension",
    "Cross-platform desktop",
    "iOS companion app",
    "Android companion app"
  ],
  productModules: [
    {
      title: "Rules",
      summary: "AI-mediated rule creation with universal templates for trade limits, schedules, and position sizing."
    },
    {
      title: "Wallet & Escrow",
      summary: "Connect Phantom, stake SOL, and manage your on-chain escrow vault."
    },
    {
      title: "Trade History",
      summary: "Full audit trail of detected trades with violation flags and penalty records."
    },
    {
      title: "Leaderboard",
      summary: "Discipline rankings with verifiable on-chain scores and gradient reward payouts."
    }
  ],
  dashboardSections: [
    {
      slug: "rules",
      title: "Rules",
      description: "Draft enforceable self-authored rules with AI clarification before activation."
    },
    {
      slug: "wallet",
      title: "Wallet",
      description: "Connect your Solana wallet, manage escrow deposits, and view vault balances."
    },
    {
      slug: "trades",
      title: "Trades",
      description: "Review detected on-chain trades, violations, and penalty history."
    },
    {
      slug: "leaderboard",
      title: "Leaderboard",
      description: "Discipline rankings and reward distribution across the network."
    }
  ],
  auth: {
    headline: "Sign in to Standard Deviants",
    summary:
      "Use the shared Saint Rocky account layer to manage browser, desktop, and on-chain enforcement from one place."
  },
  mobile: {
    title: "Mobile companion, kept intentionally simple",
    summary:
      "The mobile release focuses on auth, escrow balance, rules overview, and leaderboard while deeper enforcement stays on desktop and browser."
  }
};

export const standardDeviantsBranding = saintRockyBranding;
