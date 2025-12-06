# Should Costing Agent

An AI-powered chatbot for product cost modeling and analysis. Built with Next.js 15, CopilotKit, LangGraph, and Claude Sonnet 4.

## Features

- **Product Analysis**: Break down any product into components
- **Material Cost Calculation**: Lookup material prices from database or estimate with AI
- **Labor Cost Estimation**: Calculate manufacturing, assembly, finishing, and QC hours
- **Overhead Analysis**: Smart overhead calculation (15-40% of direct costs)
- **Human-in-the-Loop**: Approval checkpoint before final report generation
- **Detailed Reports**: Generate comprehensive cost reports with cost-saving recommendations
- **Visual Dashboard**: Charts, breakdowns, and real-time progress tracking

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, CopilotKit
- **Backend**: Next.js API Routes, Anthropic Claude Sonnet 4
- **UI Components**: shadcn/ui, Recharts for visualization
- **Database**: Mock database with seeded data (ready for Prisma/PostgreSQL)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd /Users/prashant/Documents/Projects/should-costing-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**:
   ```bash
   # Edit .env.local and add your Anthropic API key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**:
   Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

Edit `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

## Usage

1. **Describe your product** in the chat sidebar
   - Example: "I want to cost a wooden dining table that seats 6 people"
   
2. **Review the analysis** in the dashboard
   - View material costs, labor estimates, and overhead
   - Check the charts for cost distribution
   
3. **Approve the estimate** to generate the final report
   - Click "Approve & Generate Report" button
   - Or say "approve" in the chat
   
4. **Download your report** as Markdown or CSV

## Project Structure

```
should-costing-agent/
├── app/
│   ├── api/
│   │   ├── analyze/         # Cost analysis API
│   │   └── copilotkit/      # CopilotKit runtime
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Main app with CopilotKit
├── agent/
│   ├── nodes/               # LangGraph workflow nodes
│   ├── state.ts             # Agent state definition
│   └── should-costing-agent.ts
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── costing-dashboard.tsx
│   ├── materials-breakdown.tsx
│   ├── labor-estimates.tsx
│   ├── overhead-analysis.tsx
│   ├── final-report.tsx
│   └── cost-breakdown-chart.tsx
├── lib/
│   ├── db.ts               # Mock database with seeded data
│   └── utils.ts
├── tools/
│   ├── material-pricing.ts
│   ├── labor-rates.ts
│   └── similar-products.ts
└── prisma/
    └── schema.prisma       # Database schema (for production)
```

## Database

The project includes a mock database with seeded data for:
- 50+ material prices (wood, metals, plastics, textiles, hardware)
- 30 labor rates (assembly, welding, machining, finishing, etc.)
- 5 historical product costs for comparison

For production with PostgreSQL, run:
```bash
npx prisma migrate dev --name init
```

## Cost Analysis Workflow

1. **Product Analysis** → Parse description, identify components
2. **Material Costs** → Lookup prices, calculate totals
3. **Labor Costs** → Estimate hours, apply rates
4. **Overhead** → Calculate facility/admin costs
5. **Human Review** → User approval checkpoint
6. **Report Generation** → Detailed analysis with recommendations

## License

MIT
