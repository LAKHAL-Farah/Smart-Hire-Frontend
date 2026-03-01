import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/* ── Types ── */
interface DimensionScore {
  label: string;
  score: number;
  outOf: number;
  color: string;
}

interface QuestionReview {
  number: number;
  text: string;
  answer: string;
  dimensions: { label: string; score: number; color: string }[];
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface RecommendedAction {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-interview-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './interview-report.component.html',
  styleUrl: './interview-report.component.scss'
})
export class InterviewReportComponent {
  /* ── Report header ── */
  sessionDate = 'February 27, 2026';
  sessionType = 'Practice';
  questionType = 'Technical';
  careerPath = 'Backend Engineer';
  duration = '18 min 42 sec';
  finalScore = 7.8;
  percentile = 68;

  /* ── Dimension scores ── */
  dimensions: DimensionScore[] = [
    { label: 'Content', score: 8.2, outOf: 10, color: '#2ee8a5' },
    { label: 'Clarity', score: 7.4, outOf: 10, color: '#3b82f6' },
    { label: 'Confidence', score: 6.8, outOf: 10, color: '#10b981' },
    { label: 'Tone', score: 7.8, outOf: 10, color: '#8b5cf6' },
    { label: 'Non-verbal', score: 5.5, outOf: 10, color: '#f59e0b' },
  ];

  /* ── Radar chart ── */
  radarPoints = this.computeRadar();

  /* ── AI Analysis ── */
  strengths = [
    'Demonstrated strong understanding of data structure fundamentals with practical examples',
    'Responses showed clear logical progression and well-structured arguments',
    'Effective use of technical vocabulary appropriate for a Backend Engineer role',
    'Good at breaking down complex problems into smaller, manageable parts',
  ];

  areasToImprove = [
    'Could improve confidence when discussing system design topics — more practice with scale problems recommended',
    'Non-verbal communication needs attention — maintain more consistent eye contact',
    'Some answers lacked depth in edge case analysis',
  ];

  recommendations: RecommendedAction[] = [
    { icon: '🎯', title: 'Complete 3 more practice sessions focusing on vocal confidence', description: 'Your Confidence score was below average — targeted practice will help.' },
    { icon: '📚', title: 'Review System Design fundamentals on the Roadmap', description: 'Questions about scaling showed gaps in knowledge.' },
    { icon: '🎥', title: 'Enable video recording in your next session', description: 'Non-verbal analysis requires camera — this will help improve posture and expression.' },
  ];

  /* ── Question-by-question ── */
  expandedQuestion = signal<number | null>(null);

  questions: QuestionReview[] = [
    {
      number: 1,
      text: 'Explain the difference between a stack and a queue. When would you choose one over the other?',
      answer: 'A stack follows Last-In-First-Out (LIFO) principle while a queue follows First-In-First-Out (FIFO). Stacks are ideal for undo operations, expression parsing, and backtracking algorithms. Queues are perfect for task scheduling, BFS traversal, and message buffering. In backend systems, I would use a queue for processing async jobs and a stack for managing recursive operations.',
      dimensions: [
        { label: 'Content', score: 90, color: '#2ee8a5' },
        { label: 'Clarity', score: 82, color: '#3b82f6' },
        { label: 'Confidence', score: 75, color: '#10b981' },
        { label: 'Tone', score: 80, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 60, color: '#f59e0b' },
      ],
      feedback: 'Strong answer with good real-world examples. The comparison was clear and the mention of backend-specific use cases showed practical understanding.',
      strengths: ['Clear LIFO/FIFO comparison', 'Good real-world examples'],
      improvements: ['Could mention thread-safety considerations'],
    },
    {
      number: 2,
      text: 'Tell me about a time you had to resolve a conflict within your team.',
      answer: 'During a sprint at my previous internship, two team members disagreed about the database architecture. I organized a meeting where each person presented their approach with pros and cons. I facilitated the discussion by focusing on our project requirements rather than personal preferences. We ended up combining the best aspects of both proposals.',
      dimensions: [
        { label: 'Content', score: 78, color: '#2ee8a5' },
        { label: 'Clarity', score: 85, color: '#3b82f6' },
        { label: 'Confidence', score: 70, color: '#10b981' },
        { label: 'Tone', score: 82, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 55, color: '#f59e0b' },
      ],
      feedback: 'Good use of the STAR method implicitly. The response demonstrated leadership qualities and a collaborative mindset.',
      strengths: ['Structured response with clear outcome', 'Showed leadership initiative'],
      improvements: ['Add more specifics about the technical decision', 'Quantify the outcome if possible'],
    },
    {
      number: 3,
      text: 'How would you design a rate limiter for an API that handles 10,000 requests per second?',
      answer: 'I would implement a token bucket algorithm backed by Redis for distributed rate limiting. Each client gets a bucket with a configurable capacity and refill rate. On each request, we check the token count, decrement if available, or return a 429 status. For the 10K RPS scale, Redis MULTI/EXEC ensures atomicity. I would also add sliding window logging as a secondary mechanism.',
      dimensions: [
        { label: 'Content', score: 88, color: '#2ee8a5' },
        { label: 'Clarity', score: 72, color: '#3b82f6' },
        { label: 'Confidence', score: 65, color: '#10b981' },
        { label: 'Tone', score: 74, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 50, color: '#f59e0b' },
      ],
      feedback: 'Excellent technical depth. The mention of token bucket with Redis shows practical experience. Consider discussing failover scenarios.',
      strengths: ['Strong algorithm choice with justification', 'Mentioned distributed concerns'],
      improvements: ['Discuss failover and edge cases', 'Could draw a diagram to improve clarity'],
    },
    {
      number: 4,
      text: 'Walk me through how you would optimize a slow database query that involves multiple JOINs.',
      answer: 'First, I would use EXPLAIN ANALYZE to identify the query plan and bottlenecks. Common fixes include adding indexes on JOIN columns and WHERE clauses, reducing SELECT to only needed columns, and considering denormalization for frequently accessed data. If JOINs are too expensive, I might use materialized views or break the query into smaller subqueries with application-level joining.',
      dimensions: [
        { label: 'Content', score: 85, color: '#2ee8a5' },
        { label: 'Clarity', score: 78, color: '#3b82f6' },
        { label: 'Confidence', score: 72, color: '#10b981' },
        { label: 'Tone', score: 76, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 52, color: '#f59e0b' },
      ],
      feedback: 'Systematic approach starting with EXPLAIN ANALYZE is the right call. Good range of optimization strategies mentioned.',
      strengths: ['Methodical debugging approach', 'Multiple optimization strategies'],
      improvements: ['Mention query caching strategies', 'Discuss monitoring tools for ongoing optimization'],
    },
    {
      number: 5,
      text: 'Describe a situation where you had to learn a new technology quickly to meet a deadline.',
      answer: 'When our team was assigned a real-time dashboard project, I had to learn WebSockets and Socket.io within a week. I started with official documentation, built a small proof-of-concept in the first two days, then iterated on the actual implementation. I also pair-programmed with a senior dev for the complex parts. We delivered on time and the feature became one of our most-used.',
      dimensions: [
        { label: 'Content', score: 80, color: '#2ee8a5' },
        { label: 'Clarity', score: 88, color: '#3b82f6' },
        { label: 'Confidence', score: 74, color: '#10b981' },
        { label: 'Tone', score: 82, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 58, color: '#f59e0b' },
      ],
      feedback: 'Great narrative structure with a clear timeline. Showed resourcefulness by mentioning pair programming.',
      strengths: ['Clear timeline and milestones', 'Demonstrated adaptability and collaboration'],
      improvements: ['Mention how you validated your learning', 'Could discuss challenges faced during the learning process'],
    },
    {
      number: 6,
      text: 'What is the difference between horizontal and vertical scaling?',
      answer: 'Vertical scaling means adding more power to a single machine — more CPU, RAM, or storage. Horizontal scaling means adding more machines to distribute the load. Vertical is simpler but has hardware limits and single point of failure. Horizontal offers better fault tolerance and theoretically unlimited scale but requires load balancing and data consistency strategies. For a 10K RPS API, horizontal scaling with load balancers is typically the better approach.',
      dimensions: [
        { label: 'Content', score: 82, color: '#2ee8a5' },
        { label: 'Clarity', score: 80, color: '#3b82f6' },
        { label: 'Confidence', score: 68, color: '#10b981' },
        { label: 'Tone', score: 78, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 54, color: '#f59e0b' },
      ],
      feedback: 'Solid comparison with good mention of trade-offs. Connecting it back to the earlier rate limiter question showed good contextual awareness.',
      strengths: ['Clear comparison with trade-offs', 'Connected to practical context'],
      improvements: ['Mention specific tools or services for each approach'],
    },
    {
      number: 7,
      text: 'How do you handle disagreements about technical decisions with senior engineers?',
      answer: 'I approach it with data and respect. First, I try to understand their perspective fully before presenting mine. If I disagree, I prepare evidence — benchmarks, documentation, or proof-of-concepts — to support my position. Ultimately, if the senior engineer still disagrees after hearing my points, I respect the decision while documenting my concerns. I have learned that experience often sees things I might miss.',
      dimensions: [
        { label: 'Content', score: 76, color: '#2ee8a5' },
        { label: 'Clarity', score: 82, color: '#3b82f6' },
        { label: 'Confidence', score: 64, color: '#10b981' },
        { label: 'Tone', score: 80, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 52, color: '#f59e0b' },
      ],
      feedback: 'Mature and professional approach. The emphasis on data-driven arguments and respect for experience is excellent.',
      strengths: ['Professional and mature approach', 'Data-driven decision making'],
      improvements: ['Could give a specific example to strengthen the answer'],
    },
    {
      number: 8,
      text: 'Implement a function that detects a cycle in a linked list.',
      answer: 'I would use Floyd\'s cycle detection algorithm — two pointers, slow and fast. Slow moves one node at a time, fast moves two. If there is a cycle, they will eventually meet. If fast reaches null, there is no cycle. Time complexity is O(n) and space is O(1), which is optimal. For finding the cycle start, once detected, reset one pointer to head and advance both by one — they meet at the cycle start.',
      dimensions: [
        { label: 'Content', score: 92, color: '#2ee8a5' },
        { label: 'Clarity', score: 76, color: '#3b82f6' },
        { label: 'Confidence', score: 70, color: '#10b981' },
        { label: 'Tone', score: 74, color: '#8b5cf6' },
        { label: 'Non-verbal', score: 48, color: '#f59e0b' },
      ],
      feedback: 'Excellent algorithmic knowledge. Bonus points for explaining the cycle start detection. Could improve by writing pseudocode.',
      strengths: ['Optimal algorithm choice', 'Explained complexity and follow-up'],
      improvements: ['Write pseudocode or actual code', 'Discuss alternative approaches briefly'],
    },
  ];

  toggleQuestion(n: number): void {
    this.expandedQuestion.update(v => v === n ? null : n);
  }

  private computeRadar(): string {
    const cx = 100, cy = 100, r = 70;
    const scores = this.dimensions.map(d => d.score / d.outOf);
    const angleStep = (2 * Math.PI) / scores.length;
    const points = scores.map((s, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const x = cx + r * s * Math.cos(angle);
      const y = cy + r * s * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(' ');
  }

  getRadarAxisPoints(): { label: string; x: number; y: number; lx: number; ly: number }[] {
    const cx = 100, cy = 100, r = 70;
    const n = this.dimensions.length;
    const angleStep = (2 * Math.PI) / n;
    return this.dimensions.map((d, i) => {
      const angle = angleStep * i - Math.PI / 2;
      return {
        label: d.label,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        lx: cx + (r + 18) * Math.cos(angle),
        ly: cy + (r + 18) * Math.sin(angle),
      };
    });
  }

  getGridPolygon(scale: number): string {
    const cx = 100, cy = 100, r = 70;
    const n = this.dimensions.length;
    const angleStep = (2 * Math.PI) / n;
    const points: string[] = [];
    for (let i = 0; i < n; i++) {
      const angle = angleStep * i - Math.PI / 2;
      points.push(`${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`);
    }
    return points.join(' ');
  }

  getDimensionDots(q: QuestionReview): string {
    return q.dimensions.map(d => d.color).join(',');
  }
}
